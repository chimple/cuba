import { alertController } from '@ionic/core';

/**
 * Presents a native-style alert asking user to accept or reject an app update.
 * Returns `true` if user confirms, otherwise `false`.
 */
export async function showUpdateAlert(): Promise<boolean> {
  const alert = await alertController.create({
    header: 'Update Available',
    message: 'A new update is available. Do you want to download and install it now?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => false,
      },
      {
        text: 'Install',
        role: 'confirm',
        handler: () => true,
      },
    ],
  });

  await alert.present();

  const { role } = await alert.onDidDismiss();
  return role === 'confirm';
}
