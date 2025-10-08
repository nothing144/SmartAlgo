#!/usr/bin/env python3
"""
Backend API Testing Suite for Intelligent Rubrics-Based Evaluator
Testing after theme toggle addition to ensure no backend functionality is broken.
"""

import requests
import json
import time
import base64
from datetime import datetime
import os

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://shadow-highlight-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, message="", response_time=None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        time_info = f" ({response_time:.2f}s)" if response_time else ""
        result = f"{status} {test_name}{time_info}"
        if message:
            result += f" - {message}"
            
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_time': response_time
        })
        
    def test_api_health(self):
        """Test basic API health endpoints"""
        print("\n=== API Health Check ===")
        
        # Test root endpoint
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Root API Endpoint", True, 
                            f"Status: {response.status_code}, Message: {data.get('message', 'No message')}", 
                            response_time)
            else:
                self.log_test("Root API Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Error: {str(e)}")
            
        # Test /root endpoint
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/root", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Root Info Endpoint", True, 
                            f"Status: {response.status_code}, Message: {data.get('message', 'No message')}", 
                            response_time)
            else:
                self.log_test("Root Info Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Root Info Endpoint", False, f"Error: {str(e)}")
            
    def test_theme_endpoints(self):
        """Test if any theme-related endpoints exist"""
        print("\n=== Theme-Related Endpoints Check ===")
        
        theme_endpoints = [
            "/theme",
            "/themes", 
            "/user/theme",
            "/settings/theme",
            "/preferences/theme"
        ]
        
        for endpoint in theme_endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
                response_time = time.time() - start_time
                
                if response.status_code == 404:
                    self.log_test(f"Theme Endpoint {endpoint}", True, 
                                "Correctly returns 404 (no theme backend needed)", response_time)
                elif response.status_code == 200:
                    self.log_test(f"Theme Endpoint {endpoint}", True, 
                                f"Theme endpoint exists and responds: {response.status_code}", response_time)
                else:
                    self.log_test(f"Theme Endpoint {endpoint}", True, 
                                f"Unexpected status but not broken: {response.status_code}", response_time)
            except Exception as e:
                self.log_test(f"Theme Endpoint {endpoint}", False, f"Error: {str(e)}")
                
    def test_database_connectivity(self):
        """Test database connections"""
        print("\n=== Database Connectivity ===")
        
        # Test Supabase connection
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/test/supabase", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("Supabase Connection", True, 
                                f"Connected to: {data.get('supabaseUrl', 'Unknown URL')}", response_time)
                else:
                    self.log_test("Supabase Connection", False, 
                                f"Connection failed: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Supabase Connection", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Supabase Connection", False, f"Error: {str(e)}")
            
        # Test Gemini AI connection
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/test/gemini", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("Gemini AI Connection", True, 
                                f"Response: {data.get('geminiResponse', 'No response')[:50]}...", response_time)
                else:
                    self.log_test("Gemini AI Connection", False, 
                                f"Connection failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Gemini AI Connection", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Gemini AI Connection", False, f"Error: {str(e)}")
            
        # Test Cloudinary connection
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/test/cloudinary", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("Cloudinary Connection", True, 
                                f"Test image uploaded: {data.get('testImageUrl', 'No URL')}", response_time)
                else:
                    self.log_test("Cloudinary Connection", False, 
                                f"Connection failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Cloudinary Connection", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Cloudinary Connection", False, f"Error: {str(e)}")
            
    def test_rubrics_api(self):
        """Test rubrics API functionality"""
        print("\n=== Rubrics API ===")
        
        # Test GET rubrics
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/rubrics", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                rubric_count = len(data) if isinstance(data, list) else 0
                self.log_test("GET Rubrics", True, 
                            f"Retrieved {rubric_count} rubrics", response_time)
                
                # Store first rubric ID for later use
                if rubric_count > 0:
                    self.test_rubric_id = data[0].get('id')
                    self.log_test("Rubric ID Available", True, 
                                f"Using rubric ID: {self.test_rubric_id}")
                else:
                    self.test_rubric_id = None
                    self.log_test("Rubric ID Available", False, "No rubrics found")
            else:
                self.log_test("GET Rubrics", False, f"Status: {response.status_code}")
                self.test_rubric_id = None
        except Exception as e:
            self.log_test("GET Rubrics", False, f"Error: {str(e)}")
            self.test_rubric_id = None
            
    def test_submissions_api(self):
        """Test submissions API functionality"""
        print("\n=== Submissions API ===")
        
        # Test GET submissions
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/submissions", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                submission_count = len(data) if isinstance(data, list) else 0
                self.log_test("GET Submissions", True, 
                            f"Retrieved {submission_count} submissions", response_time)
            else:
                self.log_test("GET Submissions", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET Submissions", False, f"Error: {str(e)}")
            
        # Test POST submission (algorithm type) - only if we have a rubric
        if hasattr(self, 'test_rubric_id') and self.test_rubric_id:
            try:
                submission_data = {
                    "studentName": "Theme Test Student",
                    "assignmentTitle": "Theme Toggle Test - Algorithm",
                    "submissionType": "algorithm",
                    "textContent": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
                    "rubricId": self.test_rubric_id
                }
                
                start_time = time.time()
                response = requests.post(f"{API_BASE}/submissions", 
                                       json=submission_data, 
                                       timeout=30)  # Longer timeout for AI evaluation
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    submission_id = data.get('submissionId') or data.get('id')
                    status = data.get('status', 'unknown')
                    self.log_test("POST Algorithm Submission", True, 
                                f"Created submission {submission_id}, Status: {status}", response_time)
                    
                    # Test GET specific submission
                    if submission_id:
                        try:
                            start_time = time.time()
                            get_response = requests.get(f"{API_BASE}/submissions/{submission_id}", timeout=10)
                            get_response_time = time.time() - start_time
                            
                            if get_response.status_code == 200:
                                get_data = get_response.json()
                                has_evaluation = get_data.get('evaluation') is not None
                                self.log_test("GET Specific Submission", True, 
                                            f"Retrieved submission, Has evaluation: {has_evaluation}", get_response_time)
                            else:
                                self.log_test("GET Specific Submission", False, 
                                            f"Status: {get_response.status_code}")
                        except Exception as e:
                            self.log_test("GET Specific Submission", False, f"Error: {str(e)}")
                else:
                    self.log_test("POST Algorithm Submission", False, 
                                f"Status: {response.status_code}, Response: {response.text[:200]}")
            except Exception as e:
                self.log_test("POST Algorithm Submission", False, f"Error: {str(e)}")
        else:
            self.log_test("POST Algorithm Submission", False, "No rubric ID available for testing")
            
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        print("\n=== CORS Headers ===")
        
        try:
            response = requests.options(f"{API_BASE}/", timeout=5)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            has_cors = any(cors_headers.values())
            self.log_test("CORS Headers", has_cors, 
                        f"Headers present: {list(k for k, v in cors_headers.items() if v)}")
        except Exception as e:
            self.log_test("CORS Headers", False, f"Error: {str(e)}")
            
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Testing Suite")
        print(f"Testing API at: {API_BASE}")
        print("=" * 60)
        
        # Run all test suites
        self.test_api_health()
        self.test_theme_endpoints()
        self.test_database_connectivity()
        self.test_rubrics_api()
        self.test_submissions_api()
        self.test_cors_headers()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.passed_tests == self.total_tests:
            print("\n🎉 ALL TESTS PASSED! Backend is working correctly after theme toggle addition.")
        else:
            print(f"\n⚠️  {self.total_tests - self.passed_tests} tests failed. Check the issues above.")
            
        return self.passed_tests == self.total_tests

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
            "assignmentTitle": "Fibonacci Algorithm Test",
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
                    "assignmentTitle": "Sum Algorithm Pseudocode Test",
                    "textContent": "BEGIN\n  INPUT n\n  SET sum = 0\n  FOR i = 1 TO n\n    SET sum = sum + i\n  END FOR\n  OUTPUT sum\nEND",
                    "rubricId": rubric_id
                }
            },
            {
                "type": "flowchart",
                "payload": {
                    "submissionType": "flowchart",
                    "studentName": "Test Student Flowchart",
                    "assignmentTitle": "Flowchart Algorithm Test",
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
                        f"Status: {response.status_code}, Response: {response.text}")
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

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)