// import axios from "axios";
const axios = require("axios");

const whatsupAxios = axios.create({
  baseURL: __whatsup.env.BASE_URL,
  timeout: __whatsup.env.TIMEOUT,
  headers: {
    common: { "Content-Type": "application/json", Accept: "application/json" },
  },
});

// Need to mock session storage for NODE
let sessionStorage;
const _sessionStorage = {};
if (typeof window !== "undefined") {
  sessionStorage = window.sessionStorage;
} else {
  sessionStorage = {
    setItem: (key, value) => (_sessionStorage[key] = value),
    getItem: (key) => _sessionStorage[key],
    removeItem: (key) => delete _sessionStorage[key],
  };
}

const setupAxiosDefaults = (token) => {
  whatsupAxios.interceptors.request.use(function (config) {
    if (token) {
      config.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });
};

async function getQRCode() {
  const url = "/api/messages/get_qrcode";
  return whatsupAxios({
    method: "post",
    url,
    responseType: "blob",
  })
    .then((response) => ({ response }))
    .catch((error) => ({
      error: error.message,
      status: error?.response?.status,
    }));
}

const displayQrCode = async function () {
  const { response, error } = await getQRCode();
  if (!error && response && response.data) {
    let qrCodeDiv = document.getElementById("qrcode");
    if (!qrCodeDiv) {
      console.warn("[WhatsUp] where the f**k do i show QR Code");
      return;
    }
    qrCodeDiv.innerHTML += `<img alt="qrcode" src=${URL.createObjectURL(
      response.data
    )} />`;
  } else {
    console.error("could not get qr-code", error);
  }
};

const callApi = async function (url, data, headers) {
  try {
    const response = await whatsupAxios({
      method: "post",
      url,
      data,
      headers,
    });
    return response;
  } catch (error) {
    return { error };
  }
};

async function logout() {
  const url = "/api/user/logout";
  return callApi(url);
}

async function logoutFromWhatsApp() {
  const url = "/api/messages/whatsapp_logout";
  return callApi(url);
}

async function getChatsList() {
  const url = "/api/messages/get_chats_list";
  const { data, error } = await callApi(url);
  if (error) throw error;
  return data;
}

async function sendTextMessage(rjid, message) {
  if (!rjid) {
    console.error("[WhatsUp][sendTextMessage] rJid is required");
    return;
  }
  if (!message) {
    console.error("[WhatsUp][sendTextMessage] message is required");
    return;
  }
  console.log("ARGS:sendTextMessage ", rjid, message);
  const url = "/api/messages/send_text_message";
  const { data, error } = await callApi(url, { rjid: rjid, message: message });
  if (error) throw error;
  return data;
}

async function sendImageMessage(rjid, image, message = "") {
  const url = "/api/messages/send_image_message";
  var formData = new FormData();
  formData.append("rjid", rjid);
  formData.append("document", image);
  formData.append("message", message);
  const { data, error } = callApi(url, formData, {
    "Content-Type": "multipart/form-data",
  });
  if (error) throw error;
  return data;
}

async function sendAttachmentMessage(rjid, attachment) {
  const url = "/api/messages/send_attachment_message";
  var formData = new FormData();
  formData.append("rjid", rjid);
  formData.append("document", attachment);
  const { data, error } = callApi(url, formData, {
    "Content-Type": "multipart/form-data",
  });
  if (error) throw error;
  return data;
}

const whatsupWidget = (function () {
  var privateInstantiated = false;
  const wrappedFunction = function (func) {
    return function () {
      if (!func) return;
      if (!privateInstantiated) {
        console.warn(`[WhatsUp] not loaded yet, cant call ${func.name}`);
        return;
      }
      console.log("ARGS: ", arguments);
      return func.apply(this, arguments);
    };
  };
  const Login = async function (whatsupConversationsSettings) {
    const { accessToken, contactNumber, name } =
      whatsupConversationsSettings || {};

    if (!accessToken) {
      throw "[WhatsUp] accessToken is required";
    }
    setupAxiosDefaults(accessToken);
    const params = {
      contact_number: contactNumber,
      name: name,
    };
    const { data, ...rest } = await callApi("/api/user/get_user_info", params);
    if (data) {
      sessionStorage.setItem("WhatsUpName", data.name);
      sessionStorage.setItem("WhatsUpContactNumber", data.contact_number);
      sessionStorage.setItem("WhatsAppLoginStatus", data.whatsapp_login_status);
    } else {
      throw rest;
    }
    privateInstantiated = true;
  };
  return {
    load: Login,
    login: Login,
    isWidgetLoaded: () => {
      return privateInstantiated;
    },
    isWhatsAppConnected: wrappedFunction(() => {
      return sessionStorage.getItem("WhatsAppLoginStatus") === "connected";
    }),
    logout: wrappedFunction(() => {
      logout();
    }),
    logoutFromWhatsApp: wrappedFunction(() => {
      logoutFromWhatsApp();
    }),
    showQrCode: wrappedFunction(() => {
      displayQrCode();
    }),
    getChatsList: wrappedFunction(() => {
      return getChatsList();
    }),
    sendTextMessage: wrappedFunction((rjid, message) => {
      return sendTextMessage(rjid, message);
    }),
    sendImageMessage: wrappedFunction((rjid, image, caption) => {
      return sendImageMessage(rjid, image, caption);
    }),
    sendAttachmentMessage: wrappedFunction((rjid, attachment) => {
      return sendAttachmentMessage(rjid, attachment);
    }),
  };
})();

// let socket = new WebSocket("ws://localhost:9005/ws");

// socket.onopen = function (e) {
//   console.log("[open] Connection established");
//   console.log("Sending to server");
//   socket.send("My name is John");
// };

// socket.onmessage = function (event) {
//   console.log(`[message] Data received from server: ${event.data}`);
// };

// socket.onclose = function (event) {
//   if (event.wasClean) {
//     console.log(
//       `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
//     );
//   } else {
//     // e.g. server process killed or network down
//     // event.code is usually 1006 in this case
//     console.log("[close] Connection died");
//   }
// };

// socket.onerror = function (error) {
//   console.log(`[error] ${error.message}`);
// };

Object.freeze(whatsupWidget);
export { whatsupWidget };
