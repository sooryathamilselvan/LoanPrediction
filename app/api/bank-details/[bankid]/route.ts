import { type NextRequest, NextResponse } from "next/server"
import { getBankById } from "@/lib/indian-banks-data"

export async function GET(request: NextRequest, { params }: { params: { bankId: string } }) {
  try {
    const bankId = params.bankId

    if (!bankId) {
      return NextResponse.json({ error: "Bank ID is required" }, { status: 400 })
    }

    const bank = getBankById(bankId)

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    return NextResponse.json({
      bank: {
        id: bank.id,
        name: bank.name,
        type: bank.type,
        established: bank.established,
        headquarters: bank.headquarters,
        website: bank.website,
        customerCare: bank.customerCare,
        branches: bank.branches,
        rating: bank.rating,
        specialPrograms: bank.specialPrograms,
        strengths: bank.strengths,
        digitalServices: bank.digitalServices,
      },
      loanProducts: {
        homeLoan: {
          criteria: bank.homeLoanCriteria,
          features: [
            `Interest rates from ${bank.homeLoanCriteria.interestRateRange.min}% to ${bank.homeLoanCriteria.interestRateRange.max}%`,
            `Loan amount up to ₹${(bank.homeLoanCriteria.maxLoanAmount / 10000000).toFixed(1)} crores`,
            `Processing time: ${bank.homeLoanCriteria.processingTime}`,
            `LTV ratio up to ${bank.homeLoanCriteria.maxLTVRatio}%`,
          ],
        },
        personalLoan: {
          criteria: bank.personalLoanCriteria,
          features: [
            `Interest rates from ${bank.personalLoanCriteria.interestRateRange.min}% to ${bank.personalLoanCriteria.interestRateRange.max}%`,
            `Loan amount up to ₹${(bank.personalLoanCriteria.maxLoanAmount / 100000).toFixed(1)} lakhs`,
            `Processing time: ${bank.personalLoanCriteria.processingTime}`,
            `No collateral required`,
          ],
        },
        businessLoan: {
          criteria: bank.businessLoanCriteria,
          features: [
            `Interest rates from ${bank.businessLoanCriteria.interestRateRange.min}% to ${bank.businessLoanCriteria.interestRateRange.max}%`,
            `Loan amount up to ₹${(bank.businessLoanCriteria.maxLoanAmount / 10000000).toFixed(1)} crores`,
            `Processing time: ${bank.businessLoanCriteria.processingTime}`,
            `Flexible repayment options`,
          ],
        },
      },
    })
  } catch (error) {
    console.error("Bank details API error:", error)
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 })
  }
}
