"use client";
import { RegisterSchema, registerSchema } from "@/src/auth/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerAction } from "../../actions/auth";
import { getValidationErrors, isValidationError } from "@/src/auth/utils";

export default function Register() {
  const [errorMessages, setErrorMessage] = useState<Record<string, string>>({
    username: "",
    email: "",
    password: "",
    general: "",
  });
  const router = useRouter();
  const { register, formState, handleSubmit } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (formState: RegisterSchema) => {
    setErrorMessage({
      username: "",
      email: "",
      password: "",
      general: "",
    });
    try {
      const formattedData = {
        ...formState,
        email: formState.email.toLowerCase(),
      };
      console.log("submitting!");

      const response = await registerAction(formattedData);
      console.log("response!");

      if (response?.error) {
        if (isValidationError(response)) {
          const errors = getValidationErrors(response.error);
          console.log("errors!", errors);
          setErrorMessage(errors);
        } else {
          setErrorMessage({
            general: "Something went wrong... try logging in.",
          });
        }
      } else {
        router.push("/routines");
      }
    } catch (err) {
      setErrorMessage((prev) => ({
        ...prev,
        general: "Sorry... Somthing went wrong.",
      }));

      console.log("error " + err);
    }
  };
  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            {errorMessages && (
              <p className="text-error">{errorMessages.general}</p>
            )}
            <FormInput
              id="username"
              label="Username"
              {...register("username")}
              error={
                formState.errors.username?.message ?? errorMessages.username
              }
            />
            <FormInput
              id="email"
              label="Email"
              {...register("email")}
              error={formState.errors.email?.message ?? errorMessages.email}
            />
            <FormInput
              id="password"
              type="password"
              label="Password"
              {...register("password")}
              error={
                formState.errors.password?.message ?? errorMessages.password
              }
            />
            <FormInput
              id="checkPassword"
              type="password"
              label="Repeat Password"
              {...register("repeatPassword")}
              error={formState.errors.repeatPassword?.message}
            />
            <Button>Login</Button>
            <Link href="/login">Have an account already?</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
