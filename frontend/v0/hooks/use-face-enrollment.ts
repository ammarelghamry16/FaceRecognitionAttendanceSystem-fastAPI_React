"use client"

import { useState, useCallback } from "react"

export interface EnrollmentStatus {
  is_enrolled: boolean
  encodings_count: number
  last_updated?: string
}

export function useFaceEnrollment() {
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>({
    is_enrolled: false,
    encodings_count: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const checkEnrollmentStatus = useCallback(async (userId?: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Demo: keep current status
    setIsLoading(false)
  }, [])

  const enrollFaces = useCallback(async (images: string[]) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Demo: simulate successful enrollment
    setEnrollmentStatus({
      is_enrolled: true,
      encodings_count: images.length,
      last_updated: new Date().toISOString(),
    })
    setSuccess(`Successfully enrolled ${images.length} face image(s).`)
    setIsLoading(false)
  }, [])

  const deleteEnrollment = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    setEnrollmentStatus({
      is_enrolled: false,
      encodings_count: 0,
    })
    setSuccess("Face enrollment data deleted successfully.")
    setIsLoading(false)
  }, [])

  return {
    enrollmentStatus,
    isLoading,
    error,
    success,
    clearMessages,
    checkEnrollmentStatus,
    enrollFaces,
    deleteEnrollment,
  }
}
