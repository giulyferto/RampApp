/**
 * Script alternativo que usa Firebase CLI para autenticarse
 * Requiere: firebase login y firebase use <project>
 * 
 * Uso: npx ts-node src/scripts/setAdminCLI.ts <email>
 */

import * as admin from 'firebase-admin';

// Inicializar usando Application Default Credentials (Firebase CLI)
// Esto funciona si has ejecutado: firebase login
admin.initializeApp({
  projectId: 'ramp-app-70527',
});

async function setAdmin(email: string) {
  try {
    console.log(`🔍 Buscando usuario: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);
    
    console.log(`✅ Usuario encontrado: ${user.uid}`);
    console.log('🔧 Estableciendo rol de administrador...');
    
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    // Actualizar el documento en Firestore si existe
    try {
      await admin.firestore().collection('users').doc(user.uid).update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      // Si el documento no existe, crearlo
      await admin.firestore().collection('users').doc(user.uid).set({
        email: user.email || '',
        displayName: user.displayName || '',
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    await admin.auth().revokeRefreshTokens(user.uid);
    
    console.log(`\n✅ ¡Éxito! Usuario ${email} (${user.uid}) ahora es administrador`);
    console.log(`\n⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión`);
    console.log(`   para que el cambio surta efecto.\n`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('no user record')) {
        console.error(`\n❌ No se encontró un usuario con el email: ${email}`);
        console.log('   Verifica que el usuario haya iniciado sesión al menos una vez.\n');
      } else if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission')) {
        console.error(`\n❌ Error de permisos: ${error.message}`);
        console.log('\n💡 Soluciones:');
        console.log('   1. Ejecuta: firebase login');
        console.log('   2. Ejecuta: firebase use ramp-app-70527');
        console.log('   3. O descarga serviceAccountKey.json desde Firebase Console\n');
      } else {
        console.error(`\n❌ Error: ${error.message}\n`);
      }
    } else {
      console.error('❌ Error desconocido:', error);
    }
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Por favor, proporciona el email del usuario');
  console.log('Uso: npx ts-node src/scripts/setAdminCLI.ts <email-del-usuario>\n');
  process.exit(1);
}

setAdmin(email).then(() => {
  process.exit(0);
});

