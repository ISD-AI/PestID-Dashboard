import { SignUp } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Invitation Only</h2>
        <p className="text-gray-600 mb-4">
          This application is currently restricted to invited users only. Please contact the administrator for access.
        </p>
        <p className="text-sm text-gray-500">
          If you have received an invitation, please check your email for the sign-up link.
        </p>
      </div>
      <SignUp 
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "hidden" // Hide the sign-up form completely
          }
        }}
      />
    </div>
  );
}
