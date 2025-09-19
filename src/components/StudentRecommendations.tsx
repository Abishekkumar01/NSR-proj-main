import React from 'react'
import { TrendingUp, AlertTriangle, CheckCircle, Target, BookOpen, Users } from 'lucide-react'
import { Student, Assessment, StudentAssessment } from '../types'
import { graduateAttributes } from '../data/graduateAttributes'

interface StudentRecommendationsProps {
  student: Student
  assessments: Assessment[]
  studentAssessments: StudentAssessment[]
}

interface Recommendation {
  type: 'strength' | 'improvement' | 'focus'
  gaCode: string
  gaName: string
  currentScore: number
  targetScore: number
  message: string
  actions: string[]
}

export function StudentRecommendations({ student, assessments, studentAssessments }: StudentRecommendationsProps) {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = []
    const studentAssessmentsForStudent = studentAssessments.filter(sa => sa.studentId === student.id)
    
    // Calculate GA scores
    const gaScores: { [gaCode: string]: { totalScore: number; count: number; averageScore: number } } = {}
    
    graduateAttributes.forEach(ga => {
      gaScores[ga.code] = { totalScore: 0, count: 0, averageScore: 0 }
    })

    studentAssessmentsForStudent.forEach(sa => {
      sa.gaScores.forEach(gaScore => {
        if (gaScores[gaScore.gaCode]) {
          gaScores[gaScore.gaCode].totalScore += gaScore.score
          gaScores[gaScore.gaCode].count += 1
        }
      })
    })

    // Calculate averages
    Object.keys(gaScores).forEach(gaCode => {
      const gaData = gaScores[gaCode]
      if (gaData.count > 0) {
        gaData.averageScore = gaData.totalScore / gaData.count
      }
    })

    // Generate recommendations based on scores
    graduateAttributes.forEach(ga => {
      const gaData = gaScores[ga.code]
      const currentScore = gaData.averageScore
      
      if (gaData.count === 0) {
        // No assessments for this GA
        recommendations.push({
          type: 'focus',
          gaCode: ga.code,
          gaName: ga.name,
          currentScore: 0,
          targetScore: 70,
          message: `No assessments completed for ${ga.code}. This is an important area to focus on.`,
          actions: [
            'Participate in upcoming assessments that map to this GA',
            'Review course materials related to this graduate attribute',
            'Seek guidance from faculty on how to improve in this area'
          ]
        })
      } else if (currentScore >= 85) {
        // Strength
        recommendations.push({
          type: 'strength',
          gaCode: ga.code,
          gaName: ga.name,
          currentScore,
          targetScore: 90,
          message: `Excellent performance in ${ga.code}! You're demonstrating strong competency.`,
          actions: [
            'Maintain this level of performance',
            'Help peers who are struggling in this area',
            'Consider taking on leadership roles that utilize this strength'
          ]
        })
      } else if (currentScore < 60) {
        // Needs significant improvement
        recommendations.push({
          type: 'improvement',
          gaCode: ga.code,
          gaName: ga.name,
          currentScore,
          targetScore: 70,
          message: `${ga.code} requires immediate attention. Current performance is below expectations.`,
          actions: [
            'Schedule one-on-one sessions with faculty',
            'Form study groups with classmates',
            'Complete additional practice exercises',
            'Review fundamental concepts in this area'
          ]
        })
      } else if (currentScore < 75) {
        // Moderate improvement needed
        recommendations.push({
          type: 'focus',
          gaCode: ga.code,
          gaName: ga.name,
          currentScore,
          targetScore: 80,
          message: `${ga.code} shows room for improvement. With focused effort, you can reach proficiency.`,
          actions: [
            'Dedicate extra study time to this area',
            'Seek clarification on challenging concepts',
            'Practice with real-world applications'
          ]
        })
      }
    })

    // Sort recommendations by priority (improvement first, then focus, then strengths)
    return recommendations.sort((a, b) => {
      const priority = { improvement: 0, focus: 1, strength: 2 }
      return priority[a.type] - priority[b.type]
    })
  }

  const recommendations = generateRecommendations()
  const strengthsCount = recommendations.filter(r => r.type === 'strength').length
  const improvementCount = recommendations.filter(r => r.type === 'improvement').length
  const focusCount = recommendations.filter(r => r.type === 'focus').length

  const getIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'improvement': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'focus': return <Target className="w-5 h-5 text-orange-600" />
      default: return <TrendingUp className="w-5 h-5 text-blue-600" />
    }
  }

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'strength': return 'border-green-200 bg-green-50'
      case 'improvement': return 'border-red-200 bg-red-50'
      case 'focus': return 'border-orange-200 bg-orange-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Personalized Recommendations</h3>
            <p className="text-gray-600">For {student.name} ({student.rollNumber})</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">{strengthsCount} Strengths</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">{focusCount} Focus Areas</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-gray-600">{improvementCount} Need Improvement</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">Strengths</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{strengthsCount}</p>
            <p className="text-sm text-green-700">Graduate Attributes</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900">Focus Areas</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{focusCount}</p>
            <p className="text-sm text-orange-700">Graduate Attributes</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-900">Need Improvement</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{improvementCount}</p>
            <p className="text-sm text-red-700">Graduate Attributes</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assessment data available for recommendations</p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-sm border p-6 ${getCardStyle(recommendation.type)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getIcon(recommendation.type)}
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">
                      {recommendation.gaCode}: {recommendation.gaName}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{recommendation.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current Score</div>
                  <div className="text-lg font-bold text-gray-900">
                    {recommendation.currentScore.toFixed(1)}%
                  </div>
                  {recommendation.targetScore > recommendation.currentScore && (
                    <div className="text-xs text-gray-500">
                      Target: {recommendation.targetScore}%
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{recommendation.currentScore.toFixed(1)}% / {recommendation.targetScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      recommendation.type === 'strength' ? 'bg-green-600' :
                      recommendation.type === 'improvement' ? 'bg-red-600' :
                      'bg-orange-600'
                    }`}
                    style={{ width: `${Math.min((recommendation.currentScore / recommendation.targetScore) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                <ul className="space-y-1">
                  {recommendation.actions.map((action, actionIndex) => (
                    <li key={actionIndex} className="flex items-start text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}