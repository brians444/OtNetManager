import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.crud.crud import get_user_by_username, get_user_by_email
from app.core.security import get_password_hash
from app.models.user import User

def create_admin_user():
  db = SessionLocal()
  try:
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password (min 8 characters): ")

    if len(password) < 8:
      print("Password must be at least 8 characters long")
      return

    existing_username = get_user_by_username(db, username=username)
    if existing_username:
      print("Username already exists")
      return

    existing_email = get_user_by_email(db, email=email)
    if existing_email:
      print("Email already exists")
      return

    hashed_password = get_password_hash(password)
    user = User(
      username=username,
      email=email,
      hashed_password=hashed_password,
      is_admin=True,
      is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"Admin user created successfully: {user.username} (ID: {user.id})")
  finally:
    db.close()

if __name__ == "__main__":
  create_admin_user()
