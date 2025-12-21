# Implementation Plan

- [x] 1. Extend data models and database schema

  - [x] 1.1 Add new columns to FaceEncoding model


    - Add quality_score (Float, not null, default 0.0)
    - Add pose_category (String(20), nullable)
    - Add is_adaptive (Boolean, default False)
    - _Requirements: 2.1, 1.2_
  - [x] 1.2 Create UserCentroid model


    - Create new model with user_id (PK), centroid (ARRAY Float), embedding_count, avg_quality_score, pose_coverage
    - Add relationship to User model
    - _Requirements: 3.1_
  - [x] 1.3 Create database migration script


    - Write Alembic migration for new columns and table
    - Include rollback support
    - _Requirements: 1.1, 1.2, 3.1_

- [x] 2. Implement QualityAnalyzer component

  - [x] 2.1 Create QualityAnalyzer class with quality metrics computation


    - Implement sharpness calculation using Laplacian variance
    - Implement lighting uniformity using histogram analysis
    - Implement face size ratio calculation
    - Compute overall quality score as weighted average
    - _Requirements: 2.1_
  - [x] 2.2 Write property test for quality score bounds


    - **Property 1: Quality Score Bounds**
    - **Validates: Requirements 2.1**
  - [x] 2.3 Implement quality validation logic

    - Add is_acceptable() method with threshold checks
    - Return specific rejection reasons for each failure type
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [x] 2.4 Write property tests for quality rejection


    - **Property 2: Quality Rejection Consistency**
    - **Property 3: Face Size Rejection**
    - **Property 4: Multi-Face Rejection**
    - **Validates: Requirements 2.2, 2.3, 2.5**

- [x] 3. Implement PoseClassifier component

  - [x] 3.1 Create PoseClassifier class with pose detection


    - Implement pose angle extraction from InsightFace landmarks
    - Classify into 5 categories: front, left_30, right_30, up_15, down_15
    - _Requirements: 1.2_
  - [x] 3.2 Implement pose coverage tracking

    - Add get_missing_categories() method
    - Track which poses have been captured for a user
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 3.3 Write property test for enrollment completion


    - **Property 10: Enrollment Completion Criteria**
    - **Validates: Requirements 1.3, 1.4**

- [x] 4. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement CentroidManager component

  - [x] 5.1 Create CentroidManager class


    - Implement compute_centroid() with L2 normalization
    - Implement update_for_user() to recompute on changes
    - Implement get_centroid() for retrieval
    - _Requirements: 3.1, 3.2, 3.5_
  - [x] 5.2 Write property test for centroid computation


    - **Property 5: Centroid Computation Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.5**
  - [x] 5.3 Create UserCentroidRepository



    - Implement CRUD operations for UserCentroid model
    - Add method to get centroid with embeddings in single query
    - _Requirements: 3.1_

- [x] 6. Implement DuplicateChecker component

  - [x] 6.1 Create DuplicateChecker class



    - Implement is_duplicate() with 0.15 cosine distance threshold
    - Implement can_enroll_more() with 10 enrollment limit
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Write property tests for duplicate detection

    - **Property 7: Duplicate Detection Threshold**
    - **Property 8: Enrollment Limit**
    - **Validates: Requirements 4.2, 4.3**

- [x] 7. Enhance RecognitionService with new components
  - [x] 7.1 Integrate QualityAnalyzer into enrollment flow
    - Modify enroll_face() to compute and store quality metrics
    - Add quality validation before storing encoding
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 7.2 Integrate PoseClassifier into enrollment flow
    - Detect and store pose category for each enrollment
    - Track pose coverage per user
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 7.3 Integrate DuplicateChecker into enrollment flow
    - Check for duplicates before storing new encoding
    - Enforce enrollment limit
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 7.4 Integrate CentroidManager into enrollment and recognition
    - Update centroid after each enrollment/deletion
    - Use centroid in recognition matching
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 7.5 Write property test for centroid match selection
    - **Property 6: Centroid Match Selection**
    - **Validates: Requirements 3.3, 3.4**

- [x] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement adaptive threshold logic

  - [x] 9.1 Add get_adaptive_threshold() method to RecognitionService

    - Return 0.35 for users with 5+ high-quality enrollments
    - Return 0.45 for users with < 3 enrollments
    - Return 0.40 for standard cases
    - _Requirements: 5.1, 5.2_
  - [x] 9.2 Integrate adaptive thresholds into recognition flow

    - Use per-user threshold in _find_best_match()
    - Factor enrollment quality into confidence calculation
    - _Requirements: 5.3_
  - [x] 9.3 Write property test for adaptive threshold selection


    - **Property 9: Adaptive Threshold Selection**
    - **Validates: Requirements 5.1, 5.2**

- [x] 10. Implement enrollment metrics endpoint
  - [x] 10.1 Create EnrollmentMetrics response schema
    - Include count, avg_quality, pose_coverage, needs_re_enrollment, last_updated
    - _Requirements: 7.1, 7.4_
  - [x] 10.2 Add get_enrollment_metrics() method to RecognitionService
    - Compute and return all metrics for a user
    - Flag users needing re-enrollment based on quality/coverage
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 10.3 Write property test for re-enrollment flag
    - **Property 12: Re-enrollment Flag Consistency**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 10.4 Add API endpoint for enrollment metrics
    - GET /ai/enrollment/metrics/{user_id}
    - Return EnrollmentMetrics response
    - _Requirements: 7.1_

- [x] 11. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement AdaptiveLearner component (optional feature)
  - [x] 12.1 Create AdaptiveCandidate model
    - Add user_id, embedding, confidence, sequence_number, timestamp
    - _Requirements: 6.1_
  - [x] 12.2 Create AdaptiveLearner class
    - Implement record_recognition() to track high-confidence matches
    - Implement logic to add embedding after 3 consecutive matches
    - Implement replacement of oldest low-quality embedding when at limit
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 12.3 Write property test for adaptive learning toggle
    - **Property 11: Adaptive Learning Toggle**
    - **Validates: Requirements 6.1, 6.5**
  - [x] 12.4 Integrate AdaptiveLearner into recognition flow
    - Call record_recognition() after successful matches
    - Add configuration flag to enable/disable
    - Log adaptive enrollment events
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Implement LivenessDetector component (optional feature)
  - [x] 13.1 Create LivenessDetector class
    - Implement LBP texture analysis for liveness scoring
    - Implement moiré pattern detection for screen/photo detection
    - _Requirements: 8.1_
  - [x] 13.2 Write property tests for liveness detection
    - **Property 13: Liveness Toggle**
    - **Property 14: Liveness Rejection**
    - **Validates: Requirements 8.1, 8.2, 8.5**
  - [x] 13.3 Integrate LivenessDetector into enrollment and recognition
    - Add liveness check before processing
    - Require liveness for at least 2 enrollment images
    - Log spoofing attempts
    - Add configuration flag to enable/disable
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14. Update API routes and schemas
  - [x] 14.1 Update enrollment endpoints
    - Add quality_score and pose_category to EnrollmentResponse
    - Add endpoint for guided multi-angle enrollment
    - _Requirements: 1.1, 1.5, 2.1_
  - [x] 14.2 Update recognition endpoints
    - Include centroid_used flag in RecognitionResponse
    - Add adaptive_threshold to response for debugging
    - _Requirements: 3.3, 5.1_
  - [x] 14.3 Add configuration endpoints
    - POST /ai/config/adaptive-learning (enable/disable)
    - POST /ai/config/liveness-detection (enable/disable)
    - _Requirements: 6.5, 8.5_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x]* 16. Write integration tests
  - [x]* 16.1 Test complete enrollment flow with quality and pose validation






  - [x]* 16.2 Test recognition with centroid matching
  - [x]* 16.3 Test adaptive learning flow end-to-end
  - [x]* 16.4 Test liveness detection integration
