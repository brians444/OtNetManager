"""Seed default permissions and roles into the database."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.models.user import User  # Import User first to resolve relationships
from app.models.permissions import Permission, Role, role_permissions, user_roles, DEFAULT_PERMISSIONS, DEFAULT_ROLES

def seed():
  db = SessionLocal()
  try:
    # Create permissions
    perm_map = {}
    for pdata in DEFAULT_PERMISSIONS:
      existing = db.query(Permission).filter(Permission.name == pdata["name"]).first()
      if not existing:
        perm = Permission(**pdata)
        db.add(perm)
        db.flush()
        perm_map[pdata["name"]] = perm
        print(f"  Created permission: {pdata['name']}")
      else:
        perm_map[pdata["name"]] = existing

    # Create roles with permissions
    for role_name, role_data in DEFAULT_ROLES.items():
      existing = db.query(Role).filter(Role.name == role_name).first()
      if not existing:
        role = Role(
          name=role_name,
          description=role_data["description"],
          is_system=role_data.get("is_system", 0)
        )
        for pname in role_data["permissions"]:
          if pname in perm_map:
            role.permissions.append(perm_map[pname])
        db.add(role)
        print(f"  Created role: {role_name} ({len(role_data['permissions'])} permissions)")
      else:
        print(f"  Role already exists: {role_name}")

    # Assign super_admin role to existing admin users
    admin_users = db.query(User).filter(User.is_admin == True).all()
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if super_admin_role:
      for user in admin_users:
        has_role = db.execute(
          user_roles.select().where(
            user_roles.c.user_id == user.id,
            user_roles.c.role_id == super_admin_role.id
          )
        ).first()
        if not has_role:
          db.execute(user_roles.insert().values(user_id=user.id, role_id=super_admin_role.id))
          print(f"  Assigned super_admin to user: {user.username}")

    db.commit()
    print("\nSeed completed successfully!")
  except Exception as e:
    db.rollback()
    print(f"Error: {e}")
    raise
  finally:
    db.close()

if __name__ == "__main__":
  print("Seeding permissions and roles...")
  seed()
