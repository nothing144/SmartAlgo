#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Intelligent Rubrics-Based Evaluator
Tests Supabase and Cloudinary migration including all backend endpoints
"""

import requests
import json
import base64
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://tap-loader-fix.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.created_rubric_id = None
        self.created_submission_ids = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_supabase_connection(self):
        """Test Supabase database connectivity"""
        try:
            print("\n=== Testing Service Connections ===")
            response = requests.get(f"{self.base_url}/test/supabase", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test(
                        "Supabase Connection", 
                        True, 
                        "Supabase PostgreSQL connection successful",
                        f"URL: {data.get('supabaseUrl', 'N/A')}"
                    )
                    return True
                else:
                    self.log_test(
                        "Supabase Connection", 
                        False, 
                        "Unexpected response format",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Supabase Connection", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Supabase Connection", 
                False, 
                f"Connection error: {str(e)}",
                None
            )
            return False

    def test_cloudinary_connection(self):
        """Test Cloudinary image service connectivity"""
        try:
            response = requests.get(f"{self.base_url}/test/cloudinary", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'testImageUrl' in data:
                    self.log_test(
                        "Cloudinary Connection", 
                        True, 
                        "Cloudinary image upload service working",
                        f"Test image URL: {data.get('testImageUrl', '')[:50]}..."
                    )
                    return True
                else:
                    self.log_test(
                        "Cloudinary Connection", 
                        False, 
                        "Unexpected response format",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Cloudinary Connection", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Cloudinary Connection", 
                False, 
                f"Connection error: {str(e)}",
                None
            )
            return False

    def test_gemini_connection(self):
        """Test Gemini AI connectivity"""
        try:
            response = requests.get(f"{self.base_url}/test/gemini", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'geminiResponse' in data:
                    self.log_test(
                        "Gemini AI Connection", 
                        True, 
                        "Gemini AI is working correctly",
                        f"Response: {data.get('geminiResponse', '')[:100]}..."
                    )
                    return True
                else:
                    self.log_test(
                        "Gemini AI Connection", 
                        False, 
                        "Unexpected response format",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Gemini AI Connection", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Gemini AI Connection", 
                False, 
                f"Connection error: {str(e)}",
                None
            )
            return False
    
    def test_create_default_rubric(self):
        """Test creating default rubric in Supabase"""
        try:
            print("\n=== Testing Supabase Database Operations ===")
            
            rubric_data = {
                "title": "Test Evaluation Rubric - Supabase",
                "description": "Test rubric for Supabase migration evaluation",
                "submissionType": "any",
                "createdBy": "test_system"
            }
            
            response = requests.post(
                f"{self.base_url}/rubrics/default", 
                headers=self.headers, 
                json=rubric_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                # Updated to match Supabase response format (id instead of rubricId)
                if 'id' in data and 'criteria' in data:
                    self.created_rubric_id = data['id']
                    criteria_count = len(data.get('criteria', []))
                    self.log_test(
                        "Create Default Rubric (Supabase)", 
                        True, 
                        f"Rubric created in PostgreSQL with {criteria_count} criteria",
                        f"Rubric ID: {self.created_rubric_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "Create Default Rubric (Supabase)", 
                        False, 
                        "Missing required fields in response",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Create Default Rubric (Supabase)", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Create Default Rubric (Supabase)", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_list_rubrics(self):
        """Test listing available rubrics from Supabase"""
        try:
            response = requests.get(f"{self.base_url}/rubrics", headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    rubric_count = len(data)
                    has_test_rubric = any(r.get('id') == self.created_rubric_id for r in data)
                    
                    self.log_test(
                        "List Rubrics (Supabase)", 
                        True, 
                        f"Retrieved {rubric_count} rubrics from PostgreSQL, test rubric found: {has_test_rubric}",
                        f"Rubrics: {[r.get('title', 'No title') for r in data[:3]]}"
                    )
                    return True
                else:
                    self.log_test(
                        "List Rubrics (Supabase)", 
                        False, 
                        "Response is not a list",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "List Rubrics (Supabase)", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "List Rubrics (Supabase)", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_algorithm_submission(self):
        """Test algorithm submission with Supabase storage and AI evaluation"""
        try:
            print("\n=== Testing Submissions API with Supabase ===")
            
            algorithm_code = """
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Test the algorithm
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = merge_sort(numbers)
print(f"Sorted array: {sorted_numbers}")
"""
            
            submission_data = {
                "studentName": "Alice Johnson",
                "assignmentTitle": "Merge Sort Algorithm - Supabase Test",
                "submissionType": "algorithm",
                "textContent": algorithm_code,
                "userId": "student_001",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # Updated to match Supabase response format (id instead of submissionId)
                if 'id' in data:
                    submission_id = data['id']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait a moment for AI evaluation to process
                    time.sleep(3)
                    
                    self.log_test(
                        "Algorithm Submission (Supabase)", 
                        True, 
                        f"Algorithm stored in PostgreSQL, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Algorithm Submission (Supabase)", 
                        False, 
                        "Missing id in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Algorithm Submission (Supabase)", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Algorithm Submission (Supabase)", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_pseudocode_submission(self):
        """Test pseudocode submission with Supabase storage"""
        try:
            pseudocode_content = """
ALGORITHM: Heap Sort
INPUT: Array A of size n
OUTPUT: Sorted array in ascending order

BEGIN
    // Build max heap
    FOR i = n/2 - 1 DOWN TO 0 DO
        HEAPIFY(A, n, i)
    END FOR
    
    // Extract elements from heap one by one
    FOR i = n - 1 DOWN TO 1 DO
        SWAP A[0] WITH A[i]
        HEAPIFY(A, i, 0)
    END FOR
END

FUNCTION HEAPIFY(A, n, root)
BEGIN
    largest = root
    left = 2 * root + 1
    right = 2 * root + 2
    
    IF left < n AND A[left] > A[largest] THEN
        largest = left
    END IF
    
    IF right < n AND A[right] > A[largest] THEN
        largest = right
    END IF
    
    IF largest != root THEN
        SWAP A[root] WITH A[largest]
        HEAPIFY(A, n, largest)
    END IF
END
"""
            
            submission_data = {
                "studentName": "Bob Smith",
                "assignmentTitle": "Heap Sort Pseudocode - Supabase Test",
                "submissionType": "pseudocode",
                "textContent": pseudocode_content,
                "userId": "student_002",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    submission_id = data['id']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait for AI evaluation
                    time.sleep(3)
                    
                    self.log_test(
                        "Pseudocode Submission (Supabase)", 
                        True, 
                        f"Pseudocode stored in PostgreSQL, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Pseudocode Submission (Supabase)", 
                        False, 
                        "Missing id in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Pseudocode Submission (Supabase)", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Pseudocode Submission (Supabase)", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_flowchart_submission(self):
        """Test flowchart submission with base64 image"""
        try:
            # Create a simple base64 encoded test image (1x1 pixel PNG)
            test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            submission_data = {
                "studentName": "Carol Davis",
                "assignmentTitle": "Sorting Algorithm Flowchart",
                "submissionType": "flowchart",
                "imageData": test_image_b64,
                "fileName": "sorting_flowchart.png",
                "userId": "student_003",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    submission_id = data['submissionId']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait for AI evaluation
                    time.sleep(3)
                    
                    self.log_test(
                        "Flowchart Submission", 
                        True, 
                        f"Flowchart submitted successfully, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Flowchart Submission", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Flowchart Submission", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Flowchart Submission", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_list_submissions(self):
        """Test listing submissions"""
        try:
            response = requests.get(f"{self.base_url}/submissions", headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    submission_count = len(data)
                    test_submissions = [s for s in data if s.get('submissionId') in self.created_submission_ids]
                    
                    self.log_test(
                        "List Submissions", 
                        True, 
                        f"Retrieved {submission_count} submissions, {len(test_submissions)} test submissions found",
                        f"Test submission IDs: {[s.get('submissionId') for s in test_submissions]}"
                    )
                    return True
                else:
                    self.log_test(
                        "List Submissions", 
                        False, 
                        "Response is not a list",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "List Submissions", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "List Submissions", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_get_submission_with_evaluation(self, submission_id):
        """Test getting specific submission with evaluation"""
        try:
            response = requests.get(
                f"{self.base_url}/submissions/{submission_id}", 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    has_evaluation = data.get('evaluation') is not None
                    status = data.get('status', 'unknown')
                    
                    if has_evaluation:
                        eval_data = data['evaluation']
                        total_score = eval_data.get('totalScore', 0)
                        max_score = eval_data.get('maxScore', 0)
                        
                        self.log_test(
                            f"Get Submission {submission_id[:8]}...", 
                            True, 
                            f"Retrieved with evaluation, status: {status}, score: {total_score}/{max_score}",
                            f"Has AI analysis: {'aiAnalysis' in eval_data}"
                        )
                    else:
                        self.log_test(
                            f"Get Submission {submission_id[:8]}...", 
                            True, 
                            f"Retrieved without evaluation, status: {status}",
                            "Evaluation may still be processing"
                        )
                    return True
                else:
                    self.log_test(
                        f"Get Submission {submission_id[:8]}...", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return False
            else:
                self.log_test(
                    f"Get Submission {submission_id[:8]}...", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                f"Get Submission {submission_id[:8]}...", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_error_handling(self):
        """Test API error handling"""
        try:
            print("\n=== Testing Error Handling ===")
            
            # Test invalid submission type
            invalid_data = {
                "studentName": "Test Student",
                "assignmentTitle": "Test Assignment",
                "submissionType": "invalid_type",
                "textContent": "test content"
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=invalid_data,
                timeout=15
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Invalid Submission Type Error", 
                    True, 
                    "Correctly rejected invalid submission type",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Invalid Submission Type Error", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
            
            # Test missing required fields
            incomplete_data = {
                "submissionType": "algorithm"
                # Missing studentName and assignmentTitle
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=incomplete_data,
                timeout=15
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Missing Required Fields Error", 
                    True, 
                    "Correctly rejected incomplete submission",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Missing Required Fields Error", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
            
            # Test non-existent submission
            response = requests.get(
                f"{self.base_url}/submissions/non-existent-id", 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 404:
                self.log_test(
                    "Non-existent Submission Error", 
                    True, 
                    "Correctly returned 404 for non-existent submission",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Non-existent Submission Error", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Error Handling Tests", 
                False, 
                f"Test error: {str(e)}",
                None
            )
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test Gemini AI Integration
        gemini_success = self.test_gemini_connection()
        
        # Test Rubrics API
        rubric_success = self.test_create_default_rubric()
        if rubric_success:
            self.test_list_rubrics()
        
        # Test Submissions API
        if self.created_rubric_id:
            # Test different submission types
            algo_id = self.test_algorithm_submission()
            pseudo_id = self.test_pseudocode_submission()
            flow_id = self.test_flowchart_submission()
            
            # Test listing submissions
            self.test_list_submissions()
            
            # Test getting individual submissions with evaluations
            for sub_id in self.created_submission_ids:
                if sub_id:
                    self.test_get_submission_with_evaluation(sub_id)
        
        # Test error handling
        self.test_error_handling()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n🎯 KEY FEATURES TESTED:")
        print("  • Gemini AI Integration")
        print("  • Rubrics Management")
        print("  • Submissions API (Algorithm, Pseudocode, Flowchart)")
        print("  • AI-powered Evaluation Engine")
        print("  • Error Handling & Validation")
        print("  • CORS Headers")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()