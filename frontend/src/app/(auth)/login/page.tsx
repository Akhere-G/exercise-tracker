"use client";
import { LoginSchema, loginSchema } from "@/src/auth/schema";
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
import { loginAction } from "../../actions/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { register, formState, handleSubmit } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formState: LoginSchema) => {
    try {
      const response = await loginAction(formState);
      if (response?.error) {
        setErrorMessage(response.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      setErrorMessage("Sorry... Somthing went wrong.");

      console.log("error " + err);
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
