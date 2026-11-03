import * as Yup from "yup";

export const bodyWeightSchema = Yup.object().shape({
  measuredOn: Yup.string().required("Pick a date"),
  weight: Yup.number()
    .typeError("Enter your weight")
    .required("Enter your weight")
    .positive("Weight must be above zero")
    .max(1500, "That looks too high"),
});

export type BodyWeightSchema = Yup.InferType<typeof bodyWeightSchema>;
