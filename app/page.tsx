import { LoanApplicationForm } from "@/components/loan-application-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Loan Approval Predictor</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant predictions on your loan approval chances and discover which Indian banks are most likely to
            approve your application.
          </p>
        </div>
        <LoanApplicationForm />
      </div>
    </div>
  )
}
