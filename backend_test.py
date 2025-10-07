#!/usr/bin/env python3
"""
Backend Testing Script for AI Evaluation System
Focus: Testing Netlify deployment fix for synchronous evaluation
"""

import requests
import json
import time
import base64
from datetime import datetime
import sys

# Configuration
import os
BASE_URL = os.environ.get('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000') + '/api'

class AIEvaluationTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_submissions = []
        self.created_rubrics = []
        
    def log_result(self, test_name, success, details="", error_details=""):
        """Log test results with detailed information"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error_details": error_details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error_details:
            print(f"   Error: {error_details}")
        print()

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log_result("Basic API Connectivity", True, f"Status: {response.status_code}")
                return True
            else:
                self.log_result("Basic API Connectivity", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Basic API Connectivity", False, error_details=str(e))
            return False

    def test_gemini_connection(self):
        """Test Gemini AI connection"""
        try:
            response = requests.get(f"{self.base_url}/test/gemini", timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') == 'success':
                self.log_result("Gemini AI Connection", True, f"Response: {data.get('geminiResponse', '')[:100]}...")
                return True
            else:
                self.log_result("Gemini AI Connection", False, 
                              f"Status: {response.status_code}", 
                              data.get('error', 'Unknown error'))
                return False
        except Exception as e:
            self.log_result("Gemini AI Connection", False, error_details=str(e))
            return False

    def test_supabase_connection(self):
        """Test Supabase database connection"""
        try:
            response = requests.get(f"{self.base_url}/test/supabase", timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') == 'success':
                self.log_result("Supabase Connection", True, f"URL: {data.get('supabaseUrl', '')}")
                return True
            else:
                self.log_result("Supabase Connection", False, 
                              f"Status: {response.status_code}", 
                              data.get('error', 'Unknown error'))
                return False
        except Exception as e:
            self.log_result("Supabase Connection", False, error_details=str(e))
            return False

    def create_test_rubric(self):
        """Create a test rubric for evaluation"""
        try:
            rubric_data = {
                "title": f"Test Rubric {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Test rubric for AI evaluation testing",
                "submissionType": "any",
                "createdBy": "test_system"
            }
            
            response = requests.post(f"{self.base_url}/rubrics/default", 
                                   json=rubric_data, timeout=10)
            
            if response.status_code == 200:
                rubric = response.json()
                self.created_rubrics.append(rubric['id'])
                self.log_result("Create Test Rubric", True, f"Rubric ID: {rubric['id']}")
                return rubric['id']
            else:
                self.log_result("Create Test Rubric", False, 
                              f"Status: {response.status_code}", 
                              response.text)
                return None
        except Exception as e:
            self.log_result("Create Test Rubric", False, error_details=str(e))
            return None

    def test_algorithm_submission_evaluation(self, rubric_id):
        """Test algorithm submission with AI evaluation"""
        try:
            # Create algorithm submission with intentional syntax errors for testing
            submission_data = {
                "studentName": "Test Student Algorithm",
                "assignmentTitle": f"Algorithm Test {datetime.now().strftime('%H:%M:%S')}",
                "submissionType": "algorithm",
                "textContent": """
def fibonacci(n):
    if n <= 1
        return n  # Missing colon after if statement
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Test the function
result = fibonacci(10)
print(f"Fibonacci of 10 is: {result}")
print(f"Undefined variable: {undefined_var}")  # Undefined variable error
                """.strip(),
                "rubricId": rubric_id
            }
            
            print(f"Creating algorithm submission with rubric {rubric_id}...")
            response = requests.post(f"{self.base_url}/submissions", 
                                   json=submission_data, timeout=30)
            
            if response.status_code != 200:
                self.log_result("Algorithm Submission Creation", False, 
                              f"Status: {response.status_code}", response.text)
                return None
            
            submission = response.json()
            submission_id = submission['id']
            self.created_submissions.append(submission_id)
            
            print(f"Algorithm submission created: {submission_id}")
            print(f"Initial status: {submission.get('status', 'unknown')}")
            
            # Monitor evaluation process
            return self.monitor_evaluation_process(submission_id, "Algorithm Submission Evaluation")
            
        except Exception as e:
            self.log_result("Algorithm Submission Evaluation", False, error_details=str(e))
            return None

    def test_pseudocode_submission_evaluation(self, rubric_id):
        """Test pseudocode submission with AI evaluation"""
        try:
            submission_data = {
                "studentName": "Test Student Pseudocode",
                "assignmentTitle": f"Pseudocode Test {datetime.now().strftime('%H:%M:%S')}",
                "submissionType": "pseudocode",
                "textContent": """
BEGIN BubbleSort
    INPUT: array A of n elements
    FOR i = 0 to n-2
        FOR j = 0 to n-2-i
            IF A[j] > A[j+1] THEN
                SWAP A[j] and A[j+1]
            END IF
        END FOR
    END FOR
    OUTPUT: sorted array A
END BubbleSort
                """.strip(),
                "rubricId": rubric_id
            }
            
            print(f"Creating pseudocode submission with rubric {rubric_id}...")
            response = requests.post(f"{self.base_url}/submissions", 
                                   json=submission_data, timeout=30)
            
            if response.status_code != 200:
                self.log_result("Pseudocode Submission Creation", False, 
                              f"Status: {response.status_code}", response.text)
                return None
            
            submission = response.json()
            submission_id = submission['id']
            self.created_submissions.append(submission_id)
            
            print(f"Pseudocode submission created: {submission_id}")
            print(f"Initial status: {submission.get('status', 'unknown')}")
            
            # Monitor evaluation process
            return self.monitor_evaluation_process(submission_id, "Pseudocode Submission Evaluation")
            
        except Exception as e:
            self.log_result("Pseudocode Submission Evaluation", False, error_details=str(e))
            return None

    def test_flowchart_submission_evaluation(self, rubric_id):
        """Test flowchart submission with AI evaluation"""
        try:
            # Create a simple test image (1x1 pixel PNG)
            test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            
            submission_data = {
                "studentName": "Test Student Flowchart",
                "assignmentTitle": f"Flowchart Test {datetime.now().strftime('%H:%M:%S')}",
                "submissionType": "flowchart",
                "imageData": test_image_base64,
                "fileName": "test_flowchart.png",
                "rubricId": rubric_id
            }
            
            print(f"Creating flowchart submission with rubric {rubric_id}...")
            response = requests.post(f"{self.base_url}/submissions", 
                                   json=submission_data, timeout=30)
            
            if response.status_code != 200:
                self.log_result("Flowchart Submission Creation", False, 
                              f"Status: {response.status_code}", response.text)
                return None
            
            submission = response.json()
            submission_id = submission['id']
            self.created_submissions.append(submission_id)
            
            print(f"Flowchart submission created: {submission_id}")
            print(f"Initial status: {submission.get('status', 'unknown')}")
            
            # Monitor evaluation process
            return self.monitor_evaluation_process(submission_id, "Flowchart Submission Evaluation")
            
        except Exception as e:
            self.log_result("Flowchart Submission Evaluation", False, error_details=str(e))
            return None

    def test_synchronous_evaluation_behavior(self, rubric_id):
        """Test the synchronous evaluation behavior for Netlify deployment fix"""
        try:
            print("=" * 60)
            print("TESTING SYNCHRONOUS EVALUATION BEHAVIOR (NETLIFY FIX)")
            print("=" * 60)
            
            # Test all 3 submission types for synchronous behavior
            test_cases = [
                {
                    "type": "algorithm",
                    "data": {
                        "studentName": "Sync Test Algorithm",
                        "assignmentTitle": f"Sync Algorithm Test {datetime.now().strftime('%H:%M:%S')}",
                        "submissionType": "algorithm",
                        "textContent": """
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

# Test the function
test_array = [3, 6, 8, 10, 1, 2, 1]
sorted_array = quick_sort(test_array)
print(f"Sorted array: {sorted_array}")
                        """.strip(),
                        "rubricId": rubric_id
                    }
                },
                {
                    "type": "pseudocode", 
                    "data": {
                        "studentName": "Sync Test Pseudocode",
                        "assignmentTitle": f"Sync Pseudocode Test {datetime.now().strftime('%H:%M:%S')}",
                        "submissionType": "pseudocode",
                        "textContent": """
BEGIN LinearSearch
    INPUT: array A of n elements, target value x
    FOR i = 0 to n-1
        IF A[i] = x THEN
            RETURN i
        END IF
    END FOR
    RETURN -1  // Element not found
END LinearSearch
                        """.strip(),
                        "rubricId": rubric_id
                    }
                },
                {
                    "type": "flowchart",
                    "data": {
                        "studentName": "Sync Test Flowchart", 
                        "assignmentTitle": f"Sync Flowchart Test {datetime.now().strftime('%H:%M:%S')}",
                        "submissionType": "flowchart",
                        "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                        "fileName": "sync_test_flowchart.png",
                        "rubricId": rubric_id
                    }
                }
            ]
            
            sync_test_results = []
            
            for test_case in test_cases:
                print(f"\nTesting synchronous evaluation for {test_case['type']}...")
                
                # Record start time
                start_time = time.time()
                
                # Make the submission request
                print(f"Sending POST request for {test_case['type']} submission...")
                response = requests.post(f"{self.base_url}/submissions", 
                                       json=test_case['data'], timeout=60)
                
                # Record response time
                response_time = time.time() - start_time
                
                if response.status_code != 200:
                    sync_test_results.append({
                        'type': test_case['type'],
                        'success': False,
                        'error': f"HTTP {response.status_code}: {response.text}",
                        'response_time': response_time
                    })
                    continue
                
                submission = response.json()
                submission_id = submission['id']
                self.created_submissions.append(submission_id)
                
                # Check the status in the response
                response_status = submission.get('status', 'unknown')
                
                print(f"Response received after {response_time:.2f}s")
                print(f"Submission ID: {submission_id}")
                print(f"Status in response: {response_status}")
                
                # Verify synchronous behavior expectations
                is_synchronous = False
                evaluation_present = False
                
                # For synchronous evaluation, we expect:
                # 1. Response time should be longer (3-5s) as it waits for evaluation
                # 2. Status should be 'completed' or 'evaluating' (not 'submitted')
                # 3. If completed, evaluation data should be present
                
                if response_time >= 2.0:  # Should take time for evaluation
                    print(f"✅ Response time indicates synchronous processing: {response_time:.2f}s")
                    is_synchronous = True
                else:
                    print(f"⚠️  Response time too fast for synchronous evaluation: {response_time:.2f}s")
                
                if response_status in ['completed', 'evaluating']:
                    print(f"✅ Status indicates evaluation started/completed: {response_status}")
                elif response_status == 'submitted':
                    print(f"❌ Status is 'submitted' - indicates async behavior (old pattern)")
                    is_synchronous = False
                else:
                    print(f"⚠️  Unexpected status: {response_status}")
                
                # Check if evaluation data is immediately available
                if response_status == 'completed':
                    # Fetch the submission to check for evaluation data
                    detail_response = requests.get(f"{self.base_url}/submissions/{submission_id}", timeout=10)
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        evaluation = detail_data.get('evaluation')
                        if evaluation:
                            print(f"✅ Evaluation data immediately available")
                            evaluation_present = True
                        else:
                            print(f"❌ Status is 'completed' but no evaluation data found")
                
                sync_test_results.append({
                    'type': test_case['type'],
                    'success': is_synchronous and (response_status != 'submitted'),
                    'response_time': response_time,
                    'status': response_status,
                    'evaluation_present': evaluation_present,
                    'submission_id': submission_id
                })
                
                # Wait between tests
                time.sleep(3)
            
            # Analyze results
            successful_sync_tests = sum(1 for result in sync_test_results if result['success'])
            total_sync_tests = len(sync_test_results)
            
            print(f"\n" + "=" * 60)
            print("SYNCHRONOUS EVALUATION TEST RESULTS")
            print("=" * 60)
            
            for result in sync_test_results:
                status_icon = "✅" if result['success'] else "❌"
                print(f"{status_icon} {result['type'].upper()}: {result['response_time']:.2f}s, status={result['status']}")
                if 'error' in result:
                    print(f"   Error: {result['error']}")
            
            overall_success = successful_sync_tests == total_sync_tests
            
            self.log_result("Synchronous Evaluation Behavior", overall_success,
                          f"Passed {successful_sync_tests}/{total_sync_tests} synchronous tests. " +
                          f"Average response time: {sum(r['response_time'] for r in sync_test_results)/len(sync_test_results):.2f}s")
            
            return overall_success
            
        except Exception as e:
            self.log_result("Synchronous Evaluation Behavior", False, error_details=str(e))
            return False
    def monitor_evaluation_process(self, submission_id, test_name, max_wait_time=120):
        """Monitor the evaluation process for a submission"""
        start_time = time.time()
        last_status = None
        status_changes = []
        
        print(f"Monitoring evaluation for submission {submission_id}...")
        
        while time.time() - start_time < max_wait_time:
            try:
                response = requests.get(f"{self.base_url}/submissions/{submission_id}", timeout=10)
                
                if response.status_code != 200:
                    print(f"Error fetching submission: {response.status_code}")
                    time.sleep(2)
                    continue
                
                data = response.json()
                current_status = data.get('status', 'unknown')
                
                if current_status != last_status:
                    status_changes.append({
                        'status': current_status,
                        'timestamp': datetime.now().isoformat(),
                        'elapsed': round(time.time() - start_time, 2)
                    })
                    print(f"Status change: {current_status} (after {round(time.time() - start_time, 2)}s)")
                    last_status = current_status
                
                if current_status == 'completed':
                    evaluation = data.get('evaluation')
                    if evaluation:
                        self.log_result(test_name, True, 
                                      f"Evaluation completed successfully. Status changes: {status_changes}")
                        print(f"Evaluation details: Total score: {evaluation.get('totalScore', 'N/A')}/{evaluation.get('maxScore', 'N/A')}")
                        return True
                    else:
                        self.log_result(test_name, False, 
                                      f"Status is 'completed' but no evaluation data found. Status changes: {status_changes}")
                        return False
                
                elif current_status == 'error':
                    self.log_result(test_name, False, 
                                  f"Submission ended in error status. Status changes: {status_changes}")
                    return False
                
                time.sleep(3)  # Check every 3 seconds
                
            except Exception as e:
                print(f"Error monitoring submission: {e}")
                time.sleep(2)
        
        # Timeout reached
        self.log_result(test_name, False, 
                      f"Evaluation timeout after {max_wait_time}s. Final status: {last_status}. Status changes: {status_changes}")
        return False

    def check_recent_submissions_for_errors(self):
        """Check recent submissions for error patterns"""
        try:
            response = requests.get(f"{self.base_url}/submissions", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Check Recent Submissions", False, 
                              f"Status: {response.status_code}", response.text)
                return
            
            submissions = response.json()
            
            if not submissions:
                self.log_result("Check Recent Submissions", True, "No submissions found")
                return
            
            error_count = 0
            completed_count = 0
            evaluating_count = 0
            submitted_count = 0
            
            print(f"Analyzing {len(submissions)} recent submissions...")
            
            for submission in submissions[:10]:  # Check last 10 submissions
                status = submission.get('status', 'unknown')
                submission_id = submission.get('id', 'unknown')
                created_at = submission.get('createdAt', 'unknown')
                
                print(f"Submission {submission_id}: status={status}, created={created_at}")
                
                if status == 'error':
                    error_count += 1
                    # Get detailed info for error submissions
                    try:
                        detail_response = requests.get(f"{self.base_url}/submissions/{submission_id}", timeout=10)
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            evaluation = detail_data.get('evaluation')
                            print(f"  Error submission details: evaluation={evaluation}")
                    except:
                        pass
                elif status == 'completed':
                    completed_count += 1
                elif status == 'evaluating':
                    evaluating_count += 1
                elif status == 'submitted':
                    submitted_count += 1
            
            summary = f"Recent submissions analysis: {error_count} errors, {completed_count} completed, {evaluating_count} evaluating, {submitted_count} submitted"
            
            if error_count > 0:
                self.log_result("Check Recent Submissions", False, 
                              f"Found {error_count} submissions with error status. {summary}")
            else:
                self.log_result("Check Recent Submissions", True, summary)
                
        except Exception as e:
            self.log_result("Check Recent Submissions", False, error_details=str(e))
    def run_comprehensive_test(self):
        """Run comprehensive AI evaluation testing"""
        print("=" * 60)
        print("AI EVALUATION SYSTEM COMPREHENSIVE TEST")
        print("=" * 60)
        print()
        
        # Basic connectivity tests
        if not self.test_basic_connectivity():
            print("❌ Basic connectivity failed. Stopping tests.")
            return
        
        if not self.test_gemini_connection():
            print("❌ Gemini AI connection failed. This is critical for evaluation.")
        
        if not self.test_supabase_connection():
            print("❌ Supabase connection failed. This is critical for data storage.")
        
        # Check existing submissions for error patterns
        self.check_recent_submissions_for_errors()
        
        # Create test rubric
        rubric_id = self.create_test_rubric()
        if not rubric_id:
            print("❌ Failed to create test rubric. Cannot proceed with evaluation tests.")
            return
        
        print(f"Using test rubric: {rubric_id}")
        print()
        
        # Test each submission type with AI evaluation
        print("Testing AI evaluation for each submission type...")
        print()
        
        # Test algorithm evaluation
        self.test_algorithm_submission_evaluation(rubric_id)
        
        # Wait between tests to avoid rate limiting
        time.sleep(5)
        
        # Test pseudocode evaluation
        self.test_pseudocode_submission_evaluation(rubric_id)
        
        # Wait between tests
        time.sleep(5)
        
        # Test flowchart evaluation
        self.test_flowchart_submission_evaluation(rubric_id)
        
        # Final summary
        self.print_test_summary()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print()
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}")
                    if result['error_details']:
                        print(f"   Error: {result['error_details']}")
            print()
        
        print("CRITICAL ISSUES FOUND:")
        critical_issues = []
        
        # Check for specific failure patterns
        for result in self.test_results:
            if not result['success']:
                if 'Gemini' in result['test']:
                    critical_issues.append("🔥 Gemini AI connection/evaluation failures detected")
                elif 'Evaluation' in result['test'] and 'error' in result['details'].lower():
                    critical_issues.append("🔥 AI evaluation process ending in error status")
                elif 'timeout' in result['details'].lower():
                    critical_issues.append("🔥 Evaluation process timeouts - async processing issues")
        
        if critical_issues:
            for issue in set(critical_issues):  # Remove duplicates
                print(issue)
        else:
            print("✅ No critical issues detected in AI evaluation system")
        
        print()
        print(f"Created {len(self.created_submissions)} test submissions")
        print(f"Created {len(self.created_rubrics)} test rubrics")

if __name__ == "__main__":
    tester = AIEvaluationTester()
    tester.run_comprehensive_test()