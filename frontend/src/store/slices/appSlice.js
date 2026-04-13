import { createSlice } from "@reduxjs/toolkit";

const savedLanguage =
  typeof window !== "undefined" ? window.localStorage.getItem("didududadi.language") : null;
const savedAutoPlayAudio =
  typeof window !== "undefined" ? window.localStorage.getItem("didududadi.autoPlayAudio") : null;
const savedAutoNarrateOnTouch =
  typeof window !== "undefined"
    ? window.localStorage.getItem("didududadi.autoNarrateOnTouch")
    : null;
const savedSession =
  typeof window !== "undefined"
    ? JSON.parse(window.localStorage.getItem("didududadi.session") || "null")
    : null;

const appSlice = createSlice({
  name: "app",
  initialState: {
    autoPlayAudio: savedAutoPlayAudio === "true",
    autoNarrateOnTouch: savedAutoNarrateOnTouch !== "false",
    currentUser: savedSession,
    isAuthenticated: Boolean(savedSession),
    language: savedLanguage || "vi",
  },
  reducers: {
    setLanguage(state, action) {
      state.language = action.payload;
    },
    setAutoPlayAudio(state, action) {
      state.autoPlayAudio = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("didududadi.autoPlayAudio", String(action.payload));
      }
    },
    setAutoNarrateOnTouch(state, action) {
      state.autoNarrateOnTouch = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "didududadi.autoNarrateOnTouch",
          String(action.payload),
        );
      }
    },
    loginSuccess(state, action) {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  loginSuccess,
  logout,
  setAutoNarrateOnTouch,
  setAutoPlayAudio,
  setLanguage,
} = appSlice.actions;
export default appSlice.reducer;
