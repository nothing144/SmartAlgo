#!/usr/bin/env python3
"""
Investigation of Historical Error Submissions
Analyze the error submissions to understand root causes
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://code-submit-fix.preview.emergentagent.com/api"

def investigate_error_submissions():
    """Investigate submissions with error status"""
    try:
        response = requests.get(f"{BASE_URL}/submissions", timeout=10)
        if response.status_code != 200:
            print(f"❌ Cannot fetch submissions: HTTP {response.status_code}")
            return
            
        submissions = response.json()
        
        error_submissions = [s for s in submissions if s.get('status') == 'error']
        
        print(f"Found {len(error_submissions)} submissions with error status")
        print()
        
        for i, submission in enumerate(error_submissions[:10], 1):  # Check first 10 error submissions
            submission_id = submission.get('id')
            created_at = submission.get('createdAt')
            submission_type = submission.get('submissionType')
            student_name = submission.get('studentName')
            
            print(f"ERROR SUBMISSION #{i}")
            print(f"ID: {submission_id}")
            print(f"Type: {submission_type}")
            print(f"Student: {student_name}")
            print(f"Created: {created_at}")
            
            # Get detailed information
            try:
                detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    
                    print(f"Status: {detail_data.get('status')}")
                    print(f"Rubric ID: {detail_data.get('rubricId')}")
                    print(f"Has Image URL: {'Yes' if detail_data.get('imageUrl') else 'No'}")
                    print(f"Has Text Content: {'Yes' if detail_data.get('textContent') else 'No'}")
                    
                    evaluation = detail_data.get('evaluation')
                    if evaluation:
                        print(f"Evaluation: Present")
                        print(f"Total Score: {evaluation.get('totalScore', 'N/A')}")
                    else:
                        print(f"Evaluation: None")
                        
                else:
                    print(f"❌ Cannot get details: HTTP {detail_response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error getting details: {e}")
            
            print("-" * 50)
            print()
            
    except Exception as e:
        print(f"❌ Investigation failed: {e}")

def test_current_system_health():
    """Test current system health with new submissions"""
    print("TESTING CURRENT SYSTEM HEALTH")
    print("=" * 50)
    
    # Get available rubrics
    try:
        rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
        if rubrics_response.status_code != 200:
            print("❌ Cannot get rubrics")
            return
            
        rubrics = rubrics_response.json()
        if not rubrics:
            print("❌ No rubrics available")
            return
            
        rubric_id = rubrics[0]['id']
        print(f"Using rubric: {rubric_id}")
        
        # Test algorithm submission
        test_submission = {
            "studentName": f"Health Test {datetime.now().strftime('%H:%M:%S')}",
            "assignmentTitle": "System Health Check",
            "submissionType": "algorithm",
            "textContent": "def hello_world():\n    print('Hello, World!')\n    return 'success'",
            "rubricId": rubric_id
        }
        
        print("Creating test submission...")
        response = requests.post(f"{BASE_URL}/submissions", json=test_submission, timeout=30)
        
        if response.status_code == 200:
            submission = response.json()
            submission_id = submission['id']
            print(f"✅ Submission created: {submission_id}")
            
            # Monitor for 30 seconds
            import time
            for i in range(10):  # Check for 30 seconds
                time.sleep(3)
                detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
                
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    status = detail_data.get('status')
                    print(f"Status after {(i+1)*3}s: {status}")
                    
                    if status == 'completed':
                        evaluation = detail_data.get('evaluation')
                        if evaluation:
                            print(f"✅ SYSTEM HEALTHY: Evaluation completed successfully")
                            print(f"Score: {evaluation.get('totalScore')}/{evaluation.get('maxScore')}")
                        else:
                            print(f"❌ SYSTEM ISSUE: Status completed but no evaluation")
                        return
                    elif status == 'error':
                        print(f"❌ SYSTEM ISSUE: Submission failed with error status")
                        return
            
            print(f"⚠️ SYSTEM SLOW: Evaluation taking longer than 30 seconds")
            
        else:
            print(f"❌ SYSTEM ISSUE: Cannot create submission - HTTP {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Health test failed: {e}")

def main():
    print("=" * 60)
    print("ERROR INVESTIGATION AND SYSTEM HEALTH CHECK")
    print("=" * 60)
    print()
    
    investigate_error_submissions()
    
    print()
    test_current_system_health()

if __name__ == "__main__":
    main()