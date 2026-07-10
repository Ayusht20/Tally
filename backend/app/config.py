import os
from dotenv import load_dotenv


load_dotenv()

class Settings:
    # os.getenv grabs the DATABASE_URL value from your system memory
    DATABASE_URL: str = os.getenv("DATABASE_URL")

settings = Settings()