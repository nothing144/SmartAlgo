#!/usr/bin/env python3
"""
Backend API Testing for Submission Creation Fix
Testing the specific fix for blank results page issue where POST /api/submissions 
should return 'submissionId' field instead of just 'id'
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://repo-analyzer-91.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_submission_creation_response_structure():
    """Test 1: Verify POST /api/submissions returns submissionId field"""
    print("=" * 80)
    print("TEST 1: POST /api/submissions Response Structure")
    print("=" * 80)
    
    try:
        # First get a rubric to use
        rubrics_response = requests.get(f"{BASE_URL}/rubrics", headers=HEADERS)
        if rubrics_response.status_code != 200:
            log_test("Get Rubrics for Test Setup", "FAIL", f"Status: {rubrics_response.status_code}")
            return False
            
        rubrics = rubrics_response.json()
        if not rubrics:
            log_test("Get Rubrics for Test Setup", "FAIL", "No rubrics available")
            return False
            
        rubric_id = rubrics[0]['id']
        log_test("Get Rubrics for Test Setup", "PASS", f"Using rubric: {rubric_id}")
        
        # Test Algorithm Submission
        algorithm_payload = {
            "submissionType": "algorithm",
            "studentName": "Test Student Algorithm",
            "textContent": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
            "rubricId": rubric_id
        }
        
        response = requests.post(f"{BASE_URL}/submissions", 
                               headers=HEADERS, 
                               json=algorithm_payload)
        
        if response.status_code != 200:
            log_test("POST Algorithm Submission", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
        submission_data = response.json()
        
        # Check for submissionId field (the key fix)
        if 'submissionId' not in submission_data:
            log_test("POST Algorithm Submission - submissionId Field", "FAIL", 
                    f"Response missing 'submissionId' field. Keys: {list(submission_data.keys())}")
            return False
            
        log_test("POST Algorithm Submission - submissionId Field", "PASS", 
                f"submissionId: {submission_data['submissionId']}")
        
        # Verify other expected fields are in camelCase
        expected_fields = ['submissionId', 'id', 'submissionType', 'studentName', 'textContent', 'status']
        missing_fields = [field for field in expected_fields if field not in submission_data]
        
        if missing_fields:
            log_test("POST Algorithm Submission - Field Structure", "FAIL", 
                    f"Missing fields: {missing_fields}")
            return False
            
        log_test("POST Algorithm Submission - Field Structure", "PASS", 
                f"All expected fields present: {expected_fields}")
        
        # Verify submissionId matches id (transformation working)
        if submission_data['submissionId'] != submission_data['id']:
            log_test("POST Algorithm Submission - ID Mapping", "FAIL", 
                    f"submissionId ({submission_data['submissionId']}) != id ({submission_data['id']})")
            return False
            
        log_test("POST Algorithm Submission - ID Mapping", "PASS", 
                "submissionId correctly mapped from id")
        
        return submission_data['submissionId']
        
    except Exception as e:
        log_test("POST Algorithm Submission", "FAIL", f"Exception: {str(e)}")
        return False

def test_individual_submission_retrieval(submission_id):
    """Test 2: Verify GET /api/submissions/{id} works correctly"""
    print("=" * 80)
    print("TEST 2: GET /api/submissions/{id} Individual Retrieval")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/submissions/{submission_id}", headers=HEADERS)
        
        if response.status_code != 200:
            log_test("GET Individual Submission", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
        submission_data = response.json()
        
        # Check for submissionId field
        if 'submissionId' not in submission_data:
            log_test("GET Individual Submission - submissionId Field", "FAIL", 
                    f"Response missing 'submissionId' field. Keys: {list(submission_data.keys())}")
            return False
            
        log_test("GET Individual Submission - submissionId Field", "PASS", 
                f"submissionId: {submission_data['submissionId']}")
        
        # Verify the ID matches what we requested
        if submission_data['submissionId'] != submission_id:
            log_test("GET Individual Submission - ID Match", "FAIL", 
                    f"Returned submissionId ({submission_data['submissionId']}) != requested ({submission_id})")
            return False
            
        log_test("GET Individual Submission - ID Match", "PASS", 
                "Returned submissionId matches requested ID")
        
        # Check if evaluation data is included (if available)
        if 'evaluation' in submission_data and submission_data['evaluation']:
            log_test("GET Individual Submission - Evaluation Data", "PASS", 
                    "Evaluation data included in response")
        else:
            log_test("GET Individual Submission - Evaluation Data", "INFO", 
                    "No evaluation data (may still be processing)")
        
        return True
        
    except Exception as e:
        log_test("GET Individual Submission", "FAIL", f"Exception: {str(e)}")
        return False

def test_submissions_list_response():
    """Test 3: Verify GET /api/submissions returns submissionId in list"""
    print("=" * 80)
    print("TEST 3: GET /api/submissions List Response")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/submissions", headers=HEADERS)
        
        if response.status_code != 200:
            log_test("GET Submissions List", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
        submissions = response.json()
        
        if not submissions:
            log_test("GET Submissions List", "INFO", "No submissions in database")
            return True
            
        # Check first submission for submissionId field
        first_submission = submissions[0]
        if 'submissionId' not in first_submission:
            log_test("GET Submissions List - submissionId Field", "FAIL", 
                    f"First submission missing 'submissionId' field. Keys: {list(first_submission.keys())}")
            return False
            
        log_test("GET Submissions List - submissionId Field", "PASS", 
                f"First submission has submissionId: {first_submission['submissionId']}")
        
        # Check that all submissions have submissionId
        submissions_without_id = [i for i, sub in enumerate(submissions) if 'submissionId' not in sub]
        if submissions_without_id:
            log_test("GET Submissions List - All Have submissionId", "FAIL", 
                    f"Submissions at indices {submissions_without_id} missing submissionId")
            return False
            
        log_test("GET Submissions List - All Have submissionId", "PASS", 
                f"All {len(submissions)} submissions have submissionId field")
        
        return True
        
    except Exception as e:
        log_test("GET Submissions List", "FAIL", f"Exception: {str(e)}")
        return False

def test_transformation_functions():
    """Test 4: Verify transformation functions work for different submission types"""
    print("=" * 80)
    print("TEST 4: Transformation Functions for Different Types")
    print("=" * 80)
    
    try:
        # Get rubric
        rubrics_response = requests.get(f"{BASE_URL}/rubrics", headers=HEADERS)
        rubrics = rubrics_response.json()
        rubric_id = rubrics[0]['id']
        
        test_cases = [
            {
                "type": "pseudocode",
                "payload": {
                    "submissionType": "pseudocode",
                    "studentName": "Test Student Pseudocode",
                    "textContent": "BEGIN\n  INPUT n\n  SET sum = 0\n  FOR i = 1 TO n\n    SET sum = sum + i\n  END FOR\n  OUTPUT sum\nEND",
                    "rubricId": rubric_id
                }
            },
            {
                "type": "flowchart",
                "payload": {
                    "submissionType": "flowchart",
                    "studentName": "Test Student Flowchart",
                    "imageUrl": "https://res.cloudinary.com/dkmsvlhpz/image/upload/v1728290234/flowchart_example.png",
                    "rubricId": rubric_id
                }
            }
        ]
        
        for test_case in test_cases:
            submission_type = test_case["type"]
            payload = test_case["payload"]
            
            response = requests.post(f"{BASE_URL}/submissions", 
                                   headers=HEADERS, 
                                   json=payload)
            
            if response.status_code != 200:
                log_test(f"POST {submission_type.title()} Submission", "FAIL", 
                        f"Status: {response.status_code}")
                continue
                
            submission_data = response.json()
            
            # Check submissionId field
            if 'submissionId' not in submission_data:
                log_test(f"POST {submission_type.title()} - submissionId Field", "FAIL", 
                        "Missing submissionId field")
                continue
                
            log_test(f"POST {submission_type.title()} - submissionId Field", "PASS", 
                    f"submissionId: {submission_data['submissionId']}")
            
            # Check type-specific transformations
            if submission_type == "flowchart":
                if 'content' in submission_data and 'imageUrl' in submission_data['content']:
                    log_test(f"POST {submission_type.title()} - Content Transformation", "PASS", 
                            "Content properly structured with imageUrl")
                else:
                    log_test(f"POST {submission_type.title()} - Content Transformation", "FAIL", 
                            "Content not properly structured for flowchart")
            else:
                if 'content' in submission_data and 'text' in submission_data['content']:
                    log_test(f"POST {submission_type.title()} - Content Transformation", "PASS", 
                            "Content properly structured with text")
                else:
                    log_test(f"POST {submission_type.title()} - Content Transformation", "FAIL", 
                            "Content not properly structured for text submission")
        
        return True
        
    except Exception as e:
        log_test("Transformation Functions Test", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all tests for submission creation fix"""
    print("🧪 BACKEND TESTING: Submission Creation Fix")
    print("Testing the fix for blank results page issue")
    print("Focus: POST /api/submissions should return 'submissionId' field")
    print()
    
    start_time = time.time()
    
    # Test 1: Create submission and verify response structure
    submission_id = test_submission_creation_response_structure()
    if not submission_id:
        print("❌ CRITICAL: Submission creation test failed - cannot continue")
        return
    
    # Test 2: Verify individual submission retrieval
    test_individual_submission_retrieval(submission_id)
    
    # Test 3: Verify submissions list response
    test_submissions_list_response()
    
    # Test 4: Test transformation functions for different types
    test_transformation_functions()
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("=" * 80)
    print("🏁 TESTING COMPLETE")
    print(f"⏱️  Total Duration: {duration:.2f} seconds")
    print("=" * 80)

if __name__ == "__main__":
    main()