#!/usr/bin/env python3
"""
Netlify Integration Testing - Comprehensive verification of all integrations
Testing URL: https://smartalgo.netlify.app
"""

import requests
import json
import time
import base64
from datetime import datetime

BASE_URL = 'https://smartalgo.netlify.app/api'

class NetlifyIntegrationTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        
    def log_result(self, test_name, success, details="", error_details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error_details": error_details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error_details:
            print(f"   Error: {error_details}")
        print()

    def test_supabase_integration(self):
        """Test Supabase database integration"""
        print("🔍 TESTING SUPABASE DATABASE INTEGRATION")
        print("=" * 50)
        
        # Test connection
        try:
            response = requests.get(f"{self.base_url}/test/supabase", timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') == 'success':
                self.log_result("Supabase Connection", True, f"Connected to: {data.get('supabaseUrl', '')}")
            else:
                self.log_result("Supabase Connection", False, 
                              f"Status: {response.status_code}", data.get('error', 'Unknown error'))
                return False
        except Exception as e:
            self.log_result("Supabase Connection", False, error_details=str(e))
            return False
        
        # Test table access - submissions
        try:
            response = requests.get(f"{self.base_url}/submissions", timeout=10)
            if response.status_code == 200:
                submissions = response.json()
                self.log_result("Submissions Table Access", True, f"Found {len(submissions)} submissions")
            else:
                self.log_result("Submissions Table Access", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Submissions Table Access", False, error_details=str(e))
        
        # Test table access - rubrics
        try:
            response = requests.get(f"{self.base_url}/rubrics", timeout=10)
            if response.status_code == 200:
                rubrics = response.json()
                self.log_result("Rubrics Table Access", True, f"Found {len(rubrics)} rubrics")
            else:
                self.log_result("Rubrics Table Access", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Rubrics Table Access", False, error_details=str(e))
        
        return True

    def test_cloudinary_integration(self):
        """Test Cloudinary integration"""
        print("🔍 TESTING CLOUDINARY INTEGRATION")
        print("=" * 50)
        
        # Create a test image submission to verify Cloudinary upload
        try:
            # Simple 1x1 pixel PNG
            test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            
            # First create a rubric for the test
            rubric_response = requests.post(f"{self.base_url}/rubrics/default", 
                                          json={"title": "Cloudinary Test Rubric"}, timeout=10)
            
            if rubric_response.status_code != 200:
                self.log_result("Cloudinary Test Setup", False, "Failed to create test rubric")
                return False
            
            rubric_id = rubric_response.json()['id']
            
            # Create flowchart submission with image
            submission_data = {
                "studentName": "Cloudinary Test",
                "assignmentTitle": "Cloudinary Integration Test",
                "submissionType": "flowchart",
                "imageData": test_image_base64,
                "fileName": "cloudinary_test.png",
                "rubricId": rubric_id
            }
            
            print("Uploading test image to Cloudinary...")
            response = requests.post(f"{self.base_url}/submissions", 
                                   json=submission_data, timeout=30)
            
            if response.status_code == 200:
                submission = response.json()
                
                # Check if submission has image URL (indicates Cloudinary upload worked)
                detail_response = requests.get(f"{self.base_url}/submissions/{submission['id']}", timeout=10)
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    image_url = detail_data.get('imageUrl')
                    
                    if image_url and 'cloudinary.com' in image_url:
                        self.log_result("Cloudinary Image Upload", True, f"Image uploaded to: {image_url}")
                        
                        # Test if the uploaded image is accessible
                        try:
                            img_response = requests.head(image_url, timeout=10)
                            if img_response.status_code == 200:
                                self.log_result("Cloudinary Image Access", True, "Uploaded image is accessible")
                            else:
                                self.log_result("Cloudinary Image Access", False, f"Image not accessible: {img_response.status_code}")
                        except Exception as e:
                            self.log_result("Cloudinary Image Access", False, error_details=str(e))
                    else:
                        self.log_result("Cloudinary Image Upload", False, f"No Cloudinary URL found. Image URL: {image_url}")
                else:
                    self.log_result("Cloudinary Image Upload", False, "Could not retrieve submission details")
            else:
                self.log_result("Cloudinary Image Upload", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Cloudinary Integration", False, error_details=str(e))

    def test_gemini_integration(self):
        """Test Gemini AI integration"""
        print("🔍 TESTING GEMINI AI INTEGRATION")
        print("=" * 50)
        
        try:
            response = requests.get(f"{self.base_url}/test/gemini", timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') == 'success':
                self.log_result("Gemini AI Connection", True, f"Response: {data.get('geminiResponse', '')[:100]}...")
            else:
                self.log_result("Gemini AI Connection", False, 
                              f"Status: {response.status_code}", 
                              data.get('error', 'Unknown error'))
        except Exception as e:
            self.log_result("Gemini AI Connection", False, error_details=str(e))

    def test_api_endpoints(self):
        """Test all API endpoints functionality"""
        print("🔍 TESTING API ENDPOINTS")
        print("=" * 50)
        
        # Test GET /api/rubrics
        try:
            response = requests.get(f"{self.base_url}/rubrics", timeout=10)
            if response.status_code == 200:
                rubrics = response.json()
                self.log_result("GET /api/rubrics", True, f"Retrieved {len(rubrics)} rubrics")
            else:
                self.log_result("GET /api/rubrics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/rubrics", False, error_details=str(e))
        
        # Test POST /api/rubrics/default
        try:
            rubric_data = {
                "title": f"API Test Rubric {datetime.now().strftime('%H%M%S')}",
                "description": "Test rubric for API endpoint testing"
            }
            response = requests.post(f"{self.base_url}/rubrics/default", 
                                   json=rubric_data, timeout=10)
            if response.status_code == 200:
                rubric = response.json()
                self.log_result("POST /api/rubrics/default", True, f"Created rubric: {rubric['id']}")
                test_rubric_id = rubric['id']
            else:
                self.log_result("POST /api/rubrics/default", False, f"Status: {response.status_code}")
                test_rubric_id = None
        except Exception as e:
            self.log_result("POST /api/rubrics/default", False, error_details=str(e))
            test_rubric_id = None
        
        # Test GET /api/submissions
        try:
            response = requests.get(f"{self.base_url}/submissions", timeout=10)
            if response.status_code == 200:
                submissions = response.json()
                self.log_result("GET /api/submissions", True, f"Retrieved {len(submissions)} submissions")
            else:
                self.log_result("GET /api/submissions", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/submissions", False, error_details=str(e))
        
        # Test POST /api/submissions (if we have a rubric)
        if test_rubric_id:
            try:
                submission_data = {
                    "studentName": "API Test Student",
                    "assignmentTitle": "API Endpoint Test",
                    "submissionType": "algorithm",
                    "textContent": "def test(): return 'API test'",
                    "rubricId": test_rubric_id
                }
                response = requests.post(f"{self.base_url}/submissions", 
                                       json=submission_data, timeout=30)
                if response.status_code == 200:
                    submission = response.json()
                    self.log_result("POST /api/submissions", True, f"Created submission: {submission['id']}")
                    
                    # Test GET /api/submissions/{id}
                    try:
                        detail_response = requests.get(f"{self.base_url}/submissions/{submission['id']}", timeout=10)
                        if detail_response.status_code == 200:
                            self.log_result("GET /api/submissions/{id}", True, "Retrieved submission details")
                        else:
                            self.log_result("GET /api/submissions/{id}", False, f"Status: {detail_response.status_code}")
                    except Exception as e:
                        self.log_result("GET /api/submissions/{id}", False, error_details=str(e))
                else:
                    self.log_result("POST /api/submissions", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("POST /api/submissions", False, error_details=str(e))

    def test_data_integrity(self):
        """Test data integrity and UUID format"""
        print("🔍 TESTING DATA INTEGRITY")
        print("=" * 50)
        
        try:
            # Get recent submissions and check data format
            response = requests.get(f"{self.base_url}/submissions", timeout=10)
            if response.status_code == 200:
                submissions = response.json()
                
                if submissions:
                    sample_submission = submissions[0]
                    
                    # Check UUID format
                    submission_id = sample_submission.get('id', '')
                    if len(submission_id) == 36 and submission_id.count('-') == 4:
                        self.log_result("UUID Format Check", True, f"Proper UUID format: {submission_id}")
                    else:
                        self.log_result("UUID Format Check", False, f"Invalid UUID format: {submission_id}")
                    
                    # Check timestamp format
                    created_at = sample_submission.get('createdAt', '')
                    if created_at and 'T' in created_at:
                        self.log_result("Timestamp Format Check", True, f"Proper timestamp: {created_at}")
                    else:
                        self.log_result("Timestamp Format Check", False, f"Invalid timestamp: {created_at}")
                    
                    # Check required fields
                    required_fields = ['id', 'studentName', 'submissionType', 'status']
                    missing_fields = [field for field in required_fields if field not in sample_submission]
                    
                    if not missing_fields:
                        self.log_result("Required Fields Check", True, "All required fields present")
                    else:
                        self.log_result("Required Fields Check", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Data Integrity Check", True, "No submissions to check (empty database)")
            else:
                self.log_result("Data Integrity Check", False, f"Could not retrieve submissions: {response.status_code}")
        except Exception as e:
            self.log_result("Data Integrity Check", False, error_details=str(e))

    def run_comprehensive_integration_test(self):
        """Run comprehensive integration verification"""
        print("=" * 60)
        print("NETLIFY DEPLOYMENT - COMPREHENSIVE INTEGRATION VERIFICATION")
        print("Testing URL: https://smartalgo.netlify.app")
        print("=" * 60)
        print()
        
        # Test all integrations
        self.test_supabase_integration()
        self.test_cloudinary_integration()
        self.test_gemini_integration()
        self.test_api_endpoints()
        self.test_data_integrity()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print()
        print("=" * 60)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Group results by integration
        integrations = {
            'Supabase': [],
            'Cloudinary': [],
            'Gemini AI': [],
            'API Endpoints': [],
            'Data Integrity': []
        }
        
        for result in self.test_results:
            test_name = result['test']
            if 'Supabase' in test_name or 'Table' in test_name:
                integrations['Supabase'].append(result)
            elif 'Cloudinary' in test_name:
                integrations['Cloudinary'].append(result)
            elif 'Gemini' in test_name:
                integrations['Gemini AI'].append(result)
            elif 'GET' in test_name or 'POST' in test_name:
                integrations['API Endpoints'].append(result)
            else:
                integrations['Data Integrity'].append(result)
        
        print("INTEGRATION STATUS:")
        for integration, tests in integrations.items():
            if tests:
                passed = sum(1 for t in tests if t['success'])
                total = len(tests)
                status = "✅" if passed == total else "❌" if passed == 0 else "⚠️"
                print(f"{status} {integration}: {passed}/{total} tests passed")
        
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}")
                    if result['error_details']:
                        print(f"   Error: {result['error_details']}")
            print()

if __name__ == "__main__":
    tester = NetlifyIntegrationTester()
    tester.run_comprehensive_integration_test()