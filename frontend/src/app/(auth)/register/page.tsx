import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";

export default function Register() {
  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form">
            <FormInput id="username" name="username" label="Username" />
            <FormInput id="email" name="email" label="Email" />
            <FormInput
              id="password"
              type="password"
              name="password"
              label="Password"
            />
            <FormInput
              id="checkPassword"
              type="password"
              name="checkPassword"
              label="Repeat Password"
            />
            <Button>Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
