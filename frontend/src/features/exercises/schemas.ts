import * as yup from "yup";

export const exerciseSchema = yup.object({
  id: yup.number(),
  name: yup.string(),
  instructions: yup.string(),
  videoUrl: yup.string(),
  imageUrl: yup.string(),
  metrics: yup.string(),
  equipment: yup.string(),
  muscles: yup.array(yup.string()),
});
