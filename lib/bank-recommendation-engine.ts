import { indianBanks, type IndianBank, type BankCriteria } from "./indian-banks-data"

export interface UserProfile {
  age: number
  income: number
  coapplicantIncome: number
  creditHistory: number
  selfEmployed: boolean
  propertyArea: string
  loanAmount: number
  loanTerm: number
  loanType: "home" | "personal" | "business"
}

export interface BankRecommendation {
  bank: IndianBank
  matchScore: number
  eligibilityStatus: "Highly Eligible" | "Eligible" | "Conditionally Eligible" | "Not Eligible"
  reasons: string[]
  improvements: string[]
  estimatedInterestRate: number
  estimatedEMI: number
}

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / (12 * 100)
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  return Math.round(emi)
}

export function evaluateBankEligibility(user: UserProfile, bank: IndianBank): BankRecommendation {
  const criteria = getCriteriaByLoanType(bank, user.loanType)
  const totalIncome = user.income + user.coapplicantIncome

  let matchScore = 0
  const reasons: string[] = []
  const improvements: string[] = []

  // Age check
  if (user.age >= criteria.minAge && user.age <= criteria.maxAge) {
    matchScore += 15
    reasons.push("Age requirement met")
  } else {
    improvements.push(`Age should be between ${criteria.minAge} and ${criteria.maxAge} years`)
  }

  // Income check
  if (totalIncome >= criteria.minIncome) {
    matchScore += 20
    reasons.push("Income requirement satisfied")
  } else {
    improvements.push(`Minimum income required: ₹${criteria.minIncome.toLocaleString()}`)
  }

  // Credit score check (assuming 750 for good credit history, 600 for poor)
  const estimatedCreditScore = user.creditHistory === 1 ? 750 : 600
  if (estimatedCreditScore >= criteria.minCreditScore) {
    matchScore += 25
    reasons.push("Credit score meets requirements")
  } else if (criteria.acceptsNoCredit && user.creditHistory === 0) {
    matchScore += 15
    reasons.push("Bank accepts applications with limited credit history")
  } else {
    improvements.push(`Minimum credit score required: ${criteria.minCreditScore}`)
  }

  // Loan amount check
  if (user.loanAmount >= criteria.minLoanAmount && user.loanAmount <= criteria.maxLoanAmount) {
    matchScore += 15
    reasons.push("Loan amount within bank limits")
  } else if (user.loanAmount < criteria.minLoanAmount) {
    improvements.push(`Minimum loan amount: ₹${criteria.minLoanAmount.toLocaleString()}`)
  } else {
    improvements.push(`Maximum loan amount: ₹${criteria.maxLoanAmount.toLocaleString()}`)
  }

  // Self-employed check
  if (user.selfEmployed && criteria.acceptsSelfEmployed) {
    matchScore += 10
    reasons.push("Self-employed applications accepted")
  } else if (user.selfEmployed && !criteria.acceptsSelfEmployed) {
    improvements.push("Bank prefers salaried applicants")
  } else {
    matchScore += 10
    reasons.push("Employment type suitable")
  }

  // Property area check
  if (criteria.propertyAreas.includes(user.propertyArea)) {
    matchScore += 10
    reasons.push("Property area covered")
  } else {
    improvements.push(`Bank operates in: ${criteria.propertyAreas.join(", ")} areas`)
  }

  // EMI to income ratio check
  const estimatedRate = (criteria.interestRateRange.min + criteria.interestRateRange.max) / 2
  const estimatedEMI = calculateEMI(user.loanAmount, estimatedRate, user.loanTerm)
  const emiRatio = (estimatedEMI / totalIncome) * 100

  if (emiRatio <= criteria.maxEMIRatio) {
    matchScore += 5
    reasons.push("EMI to income ratio acceptable")
  } else {
    improvements.push(`EMI ratio should be below ${criteria.maxEMIRatio}%`)
  }

  // Determine eligibility status
  let eligibilityStatus: BankRecommendation["eligibilityStatus"]
  if (matchScore >= 85) {
    eligibilityStatus = "Highly Eligible"
  } else if (matchScore >= 70) {
    eligibilityStatus = "Eligible"
  } else if (matchScore >= 50) {
    eligibilityStatus = "Conditionally Eligible"
  } else {
    eligibilityStatus = "Not Eligible"
  }

  return {
    bank,
    matchScore,
    eligibilityStatus,
    reasons,
    improvements,
    estimatedInterestRate: estimatedRate,
    estimatedEMI,
  }
}

function getCriteriaByLoanType(bank: IndianBank, loanType: string): BankCriteria {
  switch (loanType) {
    case "home":
      return bank.homeLoanCriteria
    case "personal":
      return bank.personalLoanCriteria
    case "business":
      return bank.businessLoanCriteria
    default:
      return bank.homeLoanCriteria
  }
}

export function getRecommendedBanks(user: UserProfile): BankRecommendation[] {
  const recommendations = indianBanks.map((bank) => evaluateBankEligibility(user, bank))

  // Sort by match score (highest first)
  return recommendations.sort((a, b) => b.matchScore - a.matchScore)
}

export function getTopRecommendations(user: UserProfile, limit = 5): BankRecommendation[] {
  return getRecommendedBanks(user).slice(0, limit)
}

export function getEligibleBanks(user: UserProfile): BankRecommendation[] {
  return getRecommendedBanks(user).filter(
    (rec) => rec.eligibilityStatus === "Highly Eligible" || rec.eligibilityStatus === "Eligible",
  )
}
