import { createSlice } from "@reduxjs/toolkit";

const savedLanguage =
  typeof window !== "undefined" ? window.localStorage.getItem("didududadi.language") : null;

const appSlice = createSlice({
  name: "app",
  initialState: {
    autoPlayAudio: false,
    language: savedLanguage || "vi",
  },
  reducers: {
    setLanguage(state, action) {
      state.language = action.payload;
    },
    setAutoPlayAudio(state, action) {
      state.autoPlayAudio = action.payload;
    },
  },
});

export const { setAutoPlayAudio, setLanguage } = appSlice.actions;
export default appSlice.reducer;
