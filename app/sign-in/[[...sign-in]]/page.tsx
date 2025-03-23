import { SignIn } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <SignIn 
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            // Hide the sign-up link in sign-in page
            footerActionLink: "hidden"
          }
        }}
      />
    </div>
  );
}
