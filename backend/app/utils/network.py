import ipaddress
import subprocess
import platform
import re
from typing import List, Dict, Set, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from sqlalchemy.orm import Session

from ..models.user import Device


def get_all_ips_in_subnet(cidr: str) -> List[str]:
  """Get all usable host IPs in a subnet (excludes network and broadcast)"""
  try:
    network = ipaddress.ip_network(cidr, strict=False)
    return [str(ip) for ip in network.hosts()]
  except ValueError:
    return []


def get_used_ips_in_subnet(db: Session, subnet_id: int) -> Set[str]:
  """Get set of IPs currently assigned to devices in a subnet"""
  devices = db.query(Device.ip_address).filter(
    Device.subnet_id == subnet_id,
    Device.ip_address.isnot(None)
  ).all()
  return {d.ip_address for d in devices if d.ip_address}


def get_free_ips_in_subnet(db: Session, subnet_id: int, cidr: str, limit: int = 0) -> List[str]:
  """Get list of free (unassigned) IPs in a subnet"""
  all_ips = get_all_ips_in_subnet(cidr)
  used_ips = get_used_ips_in_subnet(db, subnet_id)
  free_ips = [ip for ip in all_ips if ip not in used_ips]
  if limit > 0:
    return free_ips[:limit]
  return free_ips


def is_ip_in_subnet(ip: str, cidr: str) -> bool:
  """Check if an IP address belongs to a subnet"""
  try:
    return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr, strict=False)
  except ValueError:
    return False


def get_subnet_info(cidr: str) -> dict:
  """Get information about a subnet"""
  try:
    network = ipaddress.ip_network(cidr, strict=False)
    return {
      "network_address": str(network.network_address),
      "broadcast_address": str(network.broadcast_address),
      "netmask": str(network.netmask),
      "prefix_length": network.prefixlen,
      "total_hosts": network.num_addresses - 2 if network.prefixlen < 31 else network.num_addresses,
    }
  except ValueError:
    return {}


def ping_host(ip: str, timeout: int = 2) -> Dict:
  """Ping a single host and return result"""
  param_count = "-n" if platform.system().lower() == "windows" else "-c"
  param_timeout = "-w" if platform.system().lower() == "windows" else "-W"
  # On Windows, -w is in milliseconds
  timeout_value = str(timeout * 1000) if platform.system().lower() == "windows" else str(timeout)

  try:
    result = subprocess.run(
      ["ping", param_count, "1", param_timeout, timeout_value, ip],
      capture_output=True,
      text=True,
      timeout=timeout + 3
    )

    online = result.returncode == 0
    latency_ms = None

    if online:
      # Parse latency from ping output
      if platform.system().lower() == "windows":
        match = re.search(r"tiempo[=<](\d+)ms", result.stdout)
        if not match:
          match = re.search(r"time[=<](\d+)ms", result.stdout)
      else:
        match = re.search(r"time=(\d+\.?\d*)\s*ms", result.stdout)

      if match:
        latency_ms = float(match.group(1))

    return {
      "ip": ip,
      "online": online,
      "latency_ms": latency_ms,
      "error": None
    }
  except subprocess.TimeoutExpired:
    return {
      "ip": ip,
      "online": False,
      "latency_ms": None,
      "error": "Timeout"
    }
  except Exception as e:
    return {
      "ip": ip,
      "online": False,
      "latency_ms": None,
      "error": str(e)
    }


def ping_multiple_hosts(ips: List[str], max_workers: int = 20, timeout: int = 2) -> List[Dict]:
  """Ping multiple hosts in parallel"""
  results = []
  with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = {executor.submit(ping_host, ip, timeout): ip for ip in ips}
    for future in as_completed(futures):
      results.append(future.result())
  # Sort by IP for consistent ordering
  results.sort(key=lambda x: [int(p) for p in x["ip"].split(".")])
  return results
