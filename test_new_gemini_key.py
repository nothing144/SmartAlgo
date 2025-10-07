#!/usr/bin/env python3
"""Test the new Gemini API key"""

import requests
import json
import time

BASE_URL = 'http://localhost:3000/api'

def test_gemini_api():
    print("=" * 60)
    print("TESTING NEW GEMINI API KEY")
    print("=" * 60)
    
    # First get a rubric
    print("\n1. Getting rubric...")
    rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
    if rubrics_response.status_code == 200:
        rubrics = rubrics_response.json()
        if rubrics:
            rubric_id = rubrics[0]['id']
            print(f"✅ Using rubric: {rubric_id}")
        else:
            print("❌ No rubrics available")
            return
    else:
        print(f"❌ Failed to get rubrics")
        return
    
    # Create test submission
    print("\n2. Creating test algorithm submission...")
    submission_data = {
        "studentName": "API Key Test Student",
        "assignmentTitle": "Gemini API Key Verification",
        "submissionType": "algorithm",
        "textContent": """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test
result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
        """.strip(),
        "rubricId": rubric_id
    }
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/submissions", json=submission_data, timeout=60)
    response_time = time.time() - start_time
    
    if response.status_code == 200:
        submission = response.json()
        submission_id = submission['id']
        print(f"✅ Submission created: {submission_id}")
        print(f"⏱️  Response time: {response_time:.2f}s")
        print(f"📊 Initial status: {submission.get('status', 'unknown')}")
        
        # Get detailed submission
        print("\n3. Checking evaluation results...")
        time.sleep(2)  # Brief wait
        
        detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
        if detail_response.status_code == 200:
            detail_data = detail_response.json()
            status = detail_data.get('status', 'unknown')
            evaluation = detail_data.get('evaluation')
            
            print(f"📋 Final status: {status}")
            
            if status == 'completed' and evaluation:
                print(f"✅ GEMINI API KEY WORKING!")
                print(f"📊 Score: {evaluation.get('totalScore', 0)}/{evaluation.get('maxScore', 0)}")
                print(f"💬 Feedback: {evaluation.get('feedback', 'N/A')[:100]}...")
                return True
            elif status == 'error':
                print(f"❌ GEMINI API KEY FAILED - Evaluation returned error status")
                # Try to get error details
                if 'error' in detail_data:
                    print(f"Error details: {detail_data['error']}")
                return False
            else:
                print(f"⚠️  Unexpected status: {status}")
                return False
        else:
            print(f"❌ Failed to get submission details: {detail_response.status_code}")
            return False
    else:
        print(f"❌ Submission creation failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

if __name__ == "__main__":
    success = test_gemini_api()
    print("\n" + "=" * 60)
    if success:
        print("✅ NEW GEMINI API KEY IS VALID AND WORKING")
    else:
        print("❌ NEW GEMINI API KEY TEST FAILED")
    print("=" * 60)
