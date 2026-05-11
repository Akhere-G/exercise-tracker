import { Field, FieldDescription, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";

interface FormInputProps extends React.ComponentProps<"input"> {
  id: string;
  label?: string;
  error?: string;
}

function FormInput({ id, error, label, ...props }: FormInputProps) {
  return (
    <Field>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Input id={id} {...props} />
      {error && (
        <FieldDescription className="text-error">{error}</FieldDescription>
      )}
    </Field>
  );
}

export { FormInput };
