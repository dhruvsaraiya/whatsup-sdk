import axios from "axios";
const whatupAxios = axios.create({
  baseURL: process.env.BASE_URL,
  timeout: process.env.TIMEOUT,
  headers: {
    common: { "Content-Type": "application/json", Accept: "application/json" },
  },
});

window.topSecret = {};

const setupAxiosDefaults = (token) => {
  whatupAxios.interceptors.request.use(function (config) {
    if (token) {
      config.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });
};
window.whatsupWidget = {
  load: async () => {
    if (!(window.topSecret && window.topSecret.access_token)) {
      await window.whatsupWidget.login();
    }
    if (
      window.topSecret.access_token &&
      window.topSecret.whatsapp_login_status !== "connected"
    ) {
      displayQrCode();
    } else {
    }
  },
  login: async () => {
    const { apiKey, contactNumber, name } =
      window.whatsupConversationsSettings || {};

    const params = {
      contact_number: contactNumber,
      name: name,
    };
    const { data, ...rest } = await callApi("/api/user/login", params, {
      Authorization: `Basic ${apiKey}`,
    });
    if (data) {
      if (data.access_token) {
        setupAxiosDefaults(data.access_token);
      }
      window.topSecret = {
        ...data,
      };
    } else {
      // TODO: handle erros
    }
  },
  logout: () => {
    logout();
  },
  logoutFromWhatsApp: () => {
    logoutFromWhatsApp();
  },
  showQrCode: () => {
    displayQrCode();
  },
  getChatsList: () => {
    // Working
    return getChatsList();
  },
  sendTextMessage: (rjid, message) => {
    // Working
    return sendTextMessage(rjid, message);
  },
  sendImageMessage: (rjid, image, caption) => {
    // Working
    return sendImageMessage(rjid, image, caption);
  },
  sendAttachmentMessage: (rjid, attachment) => {
    // Working
    return sendAttachmentMessage(rjid, attachment);
  },
};

async function getQRCode() {
  const url = "/api/messages/get_qrcode";
  return whatupAxios({
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
    qrCodeDiv.innerHTML += `<img alt="qrcode" src=${URL.createObjectURL(
      response.data
    )} />`;
  } else {
    console.error("could not get qr-code", error);
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
  return callApi(url);
}

async function sendTextMessage(rjid, message) {
  const url = "/api/messages/send_text_message";
  return callApi(url, { rjid: rjid, message: message });
}

async function sendImageMessage(rjid, image, message = "") {
  const url = "/api/messages/send_image_message";
  var formData = new FormData();
  formData.append("rjid", rjid);
  formData.append("document", image);
  formData.append("message", message);
  return callApi(url, formData, { "Content-Type": "multipart/form-data" });
}

async function sendAttachmentMessage(rjid, attachment) {
  const url = "/api/messages/send_attachment_message";
  var formData = new FormData();
  formData.append("rjid", rjid);
  formData.append("document", attachment);
  return callApi(url, formData, { "Content-Type": "multipart/form-data" });
}

const callApi = async function (url, data, headers) {
  try {
    const response = await whatupAxios({
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
