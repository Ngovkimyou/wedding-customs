import AuthForm from "../../components/AuthForm.js";

export const metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
