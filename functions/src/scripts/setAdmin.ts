/**
 * Script para asignar el rol de administrador a un usuario
 * 
 * Uso:
 * 1. Compilar las funciones: npm run build
 * 2. Ejecutar: node lib/scripts/setAdmin.js <email-del-usuario>
 * 
 * O ejecutar directamente con ts-node:
 * npx ts-node src/scripts/setAdmin.ts <email-del-usuario>
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Leer el projectId desde .firebaserc
function getProjectId(): string | null {
  try {
    const firebasercPath = path.join(__dirname, '../../../.firebaserc');
    if (fs.existsSync(firebasercPath)) {
      const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
      return firebaserc.projects?.default || null;
    }
  } catch (error) {
    console.error('Error al leer .firebaserc:', error);
  }
  return null;
}

// Inicializar Admin SDK
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const projectId = getProjectId();

let initialized = false;

// Intentar cargar las credenciales desde el archivo
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId || undefined,
    });
    console.log('✅ Credenciales cargadas desde serviceAccountKey.json');
    initialized = true;
  } catch (error) {
    console.error('❌ Error al cargar serviceAccountKey.json:', error);
  }
}

// Si no se pudo inicializar, mostrar instrucciones
if (!initialized) {
  console.error('\n❌ No se encontraron credenciales de servicio.\n');
  console.log('📋 Para obtener las credenciales:');
  console.log('   1. Ve a https://console.firebase.google.com');
  console.log('   2. Selecciona tu proyecto: ramp-app-70527');
  console.log('   3. Ve a Project Settings (⚙️) → Service Accounts');
  console.log('   4. Haz clic en "Generate new private key"');
  console.log('   5. Guarda el archivo JSON como: functions/serviceAccountKey.json\n');
  console.log('   O usa la variable de entorno:');
  console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"\n');
  
  // Intentar con projectId si está disponible
  if (projectId) {
    try {
      admin.initializeApp({
        projectId: projectId,
      });
      console.log(`⚠️  Inicializado con projectId: ${projectId}`);
      console.log('⚠️  Esto puede no funcionar sin credenciales. Descarga serviceAccountKey.json\n');
      initialized = true;
    } catch (error) {
      console.error('❌ No se pudo inicializar Firebase Admin SDK');
      process.exit(1);
    }
  } else {
    console.error('❌ No se pudo determinar el Project ID');
    process.exit(1);
  }
}

async function setAdmin(email: string) {
  try {
    // Buscar el usuario por email
    const user = await admin.auth().getUserByEmail(email);
    
    // Establecer el rol de administrador
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    // Actualizar o crear el documento en Firestore
    const userRef = admin.firestore().collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await userRef.set({
        email: user.email || '',
        displayName: user.displayName || '',
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Invalidar el token para que se actualice
    await admin.auth().revokeRefreshTokens(user.uid);
    
    console.log(`✅ Usuario ${email} (${user.uid}) ahora es administrador`);
    console.log(`⚠️  El usuario debe cerrar sesión y volver a iniciar sesión para que el cambio surta efecto`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('no user record')) {
        console.error(`❌ No se encontró un usuario con el email: ${email}`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    } else {
      console.error('❌ Error desconocido:', error);
    }
    process.exit(1);
  }
}

// Obtener el email desde los argumentos de la línea de comandos
const email = process.argv[2];

if (!email) {
  console.error('❌ Por favor, proporciona el email del usuario');
  console.log('Uso: node lib/scripts/setAdmin.js <email-del-usuario>');
  process.exit(1);
}

setAdmin(email).then(() => {
  process.exit(0);
});

