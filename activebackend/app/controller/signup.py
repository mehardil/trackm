import logging
from fastapi import APIRouter
from service import signup_service
from service import user_service

router = APIRouter()

@router.post("/signup/")
async def signup(signupdata: dict):
    logging.info(f"Called signup with signupdata={signupdata}")
    try:
        result = await user_service.create_user_admin(signupdata)
        if not result.get('success', True):
            return {"success": False, "message": result.get('message', 'User creation failed')}
        logging.info("signup succeeded - organization and user created, OTP sent")
        return result
    except Exception as e:
        logging.error(f"signup failed: {e}")
        return {"success": False, "message": "Internal Server Error"}


@router.post("/verify-otp")
async def verify_otp(otpdata: dict):
    logging.info(f"Called verify_otp with otpdata={otpdata}")
    try:
        org_id = otpdata.get('org_id') or otpdata.get('organization_id')
        otp = otpdata.get('otp') or otpdata.get('code')
        if org_id is None or otp is None:
            return {"success": False, "message": "org_id/organization_id and otp are required"}
        try:
            org_id = int(org_id)
        except Exception:
            return {"success": False, "message": "org_id must be an integer"}
        try:
            otp = int(otp)
        except Exception:
            return {"success": False, "message": "otp must be an integer"}
        result = signup_service.verify_organization_otp(org_id, otp)
        if result:
            logging.info(f"OTP verification succeeded for org_id={org_id}")
            return {
                "success": True, 
                "message": "Organization activated successfully!",
                "organization_id": org_id
            }
        else:
            logging.warning(f"OTP verification failed for org_id={org_id}")
            return {"success": False, "message": "Invalid or expired OTP"}
    
    except Exception as e:
        logging.error(f"verify_otp failed: {e}")
        return {"success": False, "message": "Internal Server Error"}
