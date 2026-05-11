import axios from "axios";

const baseURL = process.env.BASE_URL;
console.log("in backend, " + baseURL);
export const api = axios.create({
  withCredentials: true,
  baseURL,
});
