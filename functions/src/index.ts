/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// Sends a notification to a specific app instance
export const sendNotification =
async (token: string, title: string, body: string) : Promise<void> => {
  // make sure there request has the right data
  if (!token || !title || !body) {
    console.log("Missing token, title, or body");
    return;
  }

  // Construct the message to send
  // (see https://firebase.google.com/docs/cloud-messaging/send-message)
  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  admin.messaging().send(message)
    .catch((error) => {
      console.error("Error sending notification:", error);
      console.log("Error sending notification");
    });
};

// Monitors claimed foods, and notifies posting users
export const monitorClaimed =
  functions.database.ref("notifications/claimed").onCreate(async (snapshot) => {
    // get notification information
    const key = Object.keys(snapshot.val())[0];
    const data = snapshot.val()[key];
    const body = data["userHandle"] + " claimed \"" + data["title"] +
      "\". Get ready to hand it over";

    // send notification
    await sendNotification(data["token"], "Food claimed", body);
    return snapshot.ref.remove();
  });

// Monitors unclaimed foods, and notifies posting users
export const monitorUnclaimed = functions.database
  .ref("notifications/unclaimed").onCreate(async (snapshot) => {
    // get notification information
    const key = Object.keys(snapshot.val())[0];
    const data = snapshot.val()[key];
    const body = data["userHandle"] +
     " will no longer the picking up \"" + data["title"] +
      "\". This food is now available for others to claim";

    // send notification
    await sendNotification(data["token"], "Pickup canceled", body);
    return snapshot.ref.remove();
  });

// Monitors picked foods, and notifies posting users
export const monitorPicked =
  functions.database.ref("notifications/picked").onCreate(async (snapshot) => {
    // get notificaiton information
    const key = Object.keys(snapshot.val())[0];
    const data = snapshot.val()[key];
    const body = data["userHandle"] + " picked up \"" + data["title"] + "\"";

    await sendNotification(data["token"], "Food picked", body);
    return snapshot.ref.remove();
  });

