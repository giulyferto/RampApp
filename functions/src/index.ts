import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Inicializar Firebase Admin
admin.initializeApp();

// Tipos para los roles
type UserRole = "admin" | "user";

/**
 * Cloud Function que se ejecuta cuando un usuario se autentica por primera vez
 * Asigna el rol "user" por defecto a todos los nuevos usuarios
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Establecer el rol por defecto como "user"
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "user",
    });

    // Crear documento del usuario en Firestore (opcional, para metadata)
    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email || "",
      displayName: user.displayName || "",
      role: "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Usuario ${user.uid} creado con rol "user"`);
  } catch (error) {
    console.error(`Error al crear usuario ${user.uid}:`, error);
  }
});

/**
 * Cloud Function HTTP para asignar rol de administrador
 * Solo puede ser llamada por usuarios que ya son administradores
 * 
 * Uso: POST a /setUserRole
 * Body: { userId: string, role: "admin" | "user" }
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario esté autenticado
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado"
    );
  }

  const callerUid = context.auth.uid;
  const callerToken = await admin.auth().getUser(callerUid);
  const callerRole = callerToken.customClaims?.role as UserRole;

  // Verificar que el llamador sea administrador
  if (callerRole !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden cambiar roles"
    );
  }

  // Validar datos de entrada
  const { userId, role } = data;
  if (!userId || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Se requieren userId y role"
    );
  }

  if (role !== "admin" && role !== "user") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El rol debe ser 'admin' o 'user'"
    );
  }

  // No permitir que un admin se quite su propio rol de admin
  if (userId === callerUid && role === "user") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "No puedes quitarte tu propio rol de administrador"
    );
  }

  try {
    // Establecer el custom claim
    await admin.auth().setCustomUserClaims(userId, { role });

    // Actualizar el documento en Firestore
    await admin.firestore().collection("users").doc(userId).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Invalidar el token del usuario para que se actualice con el nuevo rol
    await admin.auth().revokeRefreshTokens(userId);

    console.log(`Rol de usuario ${userId} cambiado a ${role} por ${callerUid}`);
    return { success: true, message: `Rol cambiado a ${role}` };
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al cambiar el rol del usuario"
    );
  }
});

/**
 * Cloud Function HTTP para obtener el rol de un usuario
 * Cualquier usuario autenticado puede obtener su propio rol
 * Los administradores pueden obtener el rol de cualquier usuario
 */
export const getUserRole = functions.https.onCall(async (data, context) => {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado"
    );
  }

  const callerUid = context.auth.uid;
  const targetUserId = data.userId || callerUid; // Si no se especifica, usar el propio

  // Si el usuario quiere obtener el rol de otro, debe ser admin
  if (targetUserId !== callerUid) {
    const callerToken = await admin.auth().getUser(callerUid);
    const callerRole = callerToken.customClaims?.role as UserRole;
    if (callerRole !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo los administradores pueden ver roles de otros usuarios"
      );
    }
  }

  try {
    const user = await admin.auth().getUser(targetUserId);
    const role = (user.customClaims?.role as UserRole) || "user";
    return { userId: targetUserId, role };
  } catch (error) {
    console.error("Error al obtener rol:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al obtener el rol del usuario"
    );
  }
});

/**
 * Cloud Function HTTP para listar todos los usuarios
 * TEMPORALMENTE: Cualquier usuario autenticado puede listar usuarios
 * TODO: Restringir solo a administradores cuando termine la configuración inicial
 */
export const listUsers = functions.https.onCall(async (data, context) => {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado"
    );
  }

  // TEMPORALMENTE: Permitir a cualquier usuario autenticado listar usuarios
  // TODO: Descomentar esto cuando termine la configuración inicial
  /*
  const callerUid = context.auth.uid;
  const callerToken = await admin.auth().getUser(callerUid);
  const callerRole = callerToken.customClaims?.role as UserRole;

  if (callerRole !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden listar usuarios"
    );
  }
  */

  try {
    const listUsersResult = await admin.auth().listUsers(1000); // Máximo 1000 usuarios
    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: (user.customClaims?.role as UserRole) || "user",
      createdAt: user.metadata.creationTime,
    }));

    return { users };
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al listar usuarios"
    );
  }
});

