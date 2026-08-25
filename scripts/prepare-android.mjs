import fs from 'node:fs';
import path from 'node:path';

const gradlePath = path.resolve('android/app/build.gradle');
if (!fs.existsSync(gradlePath)) {
  throw new Error('No existe android/app/build.gradle. Ejecuta primero npx cap add android.');
}

let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 14');
gradle = gradle.replace(/versionName\s+["'][^"']+["']/, 'versionName "0.9.5"');

if (!gradle.includes('tavernkeeper-dev.jks')) {
  gradle = gradle.replace(
    /android\s*\{/, 
    `android {\n    signingConfigs {\n        debug {\n            storeFile file("../../android-dev/tavernkeeper-dev.jks")\n            storePassword "tavernkeeperdev2026"\n            keyAlias "tavernkeeperdev"\n            keyPassword "tavernkeeperdev2026"\n        }\n    }`
  );
  gradle = gradle.replace(
    /buildTypes\s*\{/, 
    `buildTypes {\n        debug {\n            signingConfig signingConfigs.debug\n        }`
  );
}

fs.writeFileSync(gradlePath, gradle);
console.log('Android preparado: com.alfonso.tavernkeeper · versionCode 14 · versionName 0.9.5 · firma DEV estable.');
