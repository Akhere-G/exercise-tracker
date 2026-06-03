"use client";
import { LoginSchema, loginSchema } from "@/src/features/auth/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { loginAction } from "../../../features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { register, formState, handleSubmit } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formState: LoginSchema) => {
    try {
      const formattedData = {
        ...formState,
        email: formState.email.toLowerCase(),
      };
      const response = await loginAction(formattedData);
      if (response?.error) {
        setErrorMessage(response.error);
      } else {
        router.push("/routines");
      }
    } catch {
      setErrorMessage("Sorry... Somthing went wrong.");
    }
  };
  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            {errorMessage && <p className="text-error">{errorMessage}</p>}
            <FormInput
              id="email"
              label="Email"
              {...register("email")}
              error={formState.errors.email?.message}
            />
            <FormInput
              id="password"
              type="password"
              label="Password"
              {...register("password")}
              error={formState.errors.password?.message}
            />
            <Button>Login</Button>
            <Link href="/register">Create account?</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
