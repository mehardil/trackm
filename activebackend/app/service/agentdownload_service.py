from database import get_connection
import psycopg2
import psycopg2.extras
import logging
from typing import List, Dict, Any, Optional
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import threading
import bcrypt
from config import config


def send_link_email(email, download_link):
    msg = MIMEText(f"Your Agent download link is this : {download_link}")
    msg["Subject"] = "Agent Download Link"
    msg["From"] = config.SMTP_EMAIL
    msg["To"] = email
    try:
        with smtplib.SMTP_SSL(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.login(config.SMTP_EMAIL, config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logging.error(f"Failed to send OTP email: {e}")
        return False

def send_link_email_background(email,download_link):
    thread = threading.Thread(target=send_link_email, args=(email, download_link))
    thread.daemon = True
    thread.start()
    return True


def send_agent_link_email(email: str, token: str):
    logging.info(f"Sending agent download email to {email}")
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        download_link = f"http://127.0.0.1:9900/download-agent?source={token}&email={email}"
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print(email,download_link ,"here is download link  and email")
        email_send_status = send_link_email_background(email,download_link)
        if email_send_status:
            return {
                "success": True,
                "message": "Agent Download Email has been successfully Shared",
                "email":email 
            }
    except Exception as e:
        logging.error(f"Error sending agent download email: {e}")
        raise





def generate_agent_download_link(source: str, token: str):
    logging.info(f"Generating agent download link for {source}")
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        download_link = f"http://127.0.0.1:9900/download-agent?source={token}&source={source}"
        return download_link
    except Exception as e:
        logging.error(f"Error sending agent download email: {e}")
        raise