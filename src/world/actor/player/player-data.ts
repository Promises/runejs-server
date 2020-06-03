import {Item} from '@server/world/items/item';
import {writeFileSync, readFileSync, existsSync} from 'fs';
import {join} from 'path';
import {logger} from '@runejs/logger/dist/logger';
import {Player} from './player';
import {SkillValue} from '@server/world/actor/skills';
import admin from "firebase-admin";
import firebase from "firebase";
import UserCredential = firebase.auth.UserCredential;

export interface QuestProgress {
    questId: string;
    stage: string;
    attributes: { [key: string]: any };
}

export interface Appearance {
    gender: number;
    head: number;
    torso: number;
    arms: number;
    legs: number;
    hands: number;
    feet: number;
    facialHair: number;
    hairColor: number;
    torsoColor: number;
    legColor: number;
    feetColor: number;
    skinColor: number;
}

export class PlayerSettings {
    musicVolume: number = 0;
    soundEffectVolume: number = 0;
    areaEffectVolume: number = 0;
    splitPrivateChatEnabled: boolean = false;
    twoMouseButtonsEnabled: boolean = true;
    screenBrightness: number = 2;
    chatEffectsEnabled: boolean = true;
    acceptAidEnabled: boolean = true;
    runEnabled: boolean = false;
    autoRetaliateEnabled: boolean = true;
    attackStyle: number = 0;
    bankInsertMode: number = 0;
}

export interface PlayerSave {
    username: string;
    rights: number;
    position: {
        x: number;
        y: number;
        level: number;
    };
    lastLogin: {
        date: Date;
        address: string;
    };
    appearance: Appearance;
    inventory: Item[];
    equipment: Item[];
    skills: SkillValue[];
    settings: PlayerSettings;
    savedMetadata: { [key: string]: any };
    quests: QuestProgress[];
}

export const defaultAppearance = (): Appearance => {
    return {
        gender: 0,
        head: 0,
        torso: 18,
        arms: 26,
        legs: 36,
        hands: 33,
        feet: 42,
        facialHair: 10,
        hairColor: 0,
        torsoColor: 0,
        legColor: 0,
        feetColor: 0,
        skinColor: 0
    } as Appearance;
};

export const defaultSettings = (): PlayerSettings => {
    return new PlayerSettings();
};

export const validateSettings = (player: Player): void => {
    const existingKeys = Object.keys(player.settings);
    const newSettings = new PlayerSettings();
    const newKeys = Object.keys(newSettings);

    if (newKeys.length === existingKeys.length) {
        return;
    }

    const missingKeys = newKeys.filter(key => existingKeys.indexOf(key) === -1);
    for (const key of missingKeys) {
        player.settings[key] = newSettings[key];
    }
};

export function savePlayerData(player: Player): boolean {
    const fileName = player.username.toLowerCase() + '.json';
    const filePath = join('data/saves', fileName);

    const playerSave: PlayerSave = {
        username: player.username,
        position: {
            x: player.position.x,
            y: player.position.y,
            level: player.position.level
        },
        lastLogin: {
            date: player.loginDate,
            address: player.lastAddress
        },
        rights: player.rights.valueOf(),
        appearance: player.appearance,
        inventory: player.inventory.items,
        equipment: player.equipment.items,
        skills: player.skills.values,
        settings: player.settings,
        savedMetadata: player.savedMetadata,
        quests: player.quests,
    };

    try {
        writeFileSync(filePath, JSON.stringify(playerSave, null, 4));
        return true;
    } catch (error) {
        logger.error(`Error saving player data for ${player.username}.`);
        return false;
    }
}


export function savePlayerDataFirebase(player: Player): Promise<boolean> {
    const playerSave: PlayerSave = {
        username: player.username,
        position: {
            x: player.position.x,
            y: player.position.y,
            level: player.position.level
        },
        lastLogin: {
            date: player.loginDate,
            address: player.lastAddress
        },
        rights: player.rights.valueOf(),
        appearance: player.appearance,
        inventory: player.inventory.items,
        equipment: player.equipment.items,
        skills: player.skills.values,
        settings: player.settings,
        savedMetadata: player.savedMetadata,
        quests: player.quests,
    };

    return admin.firestore().collection("players").doc(player.fbCredentials.user.uid).set(JSON.parse(JSON.stringify(playerSave))).then(value => {
        return true;
    })


}

export enum FBResponseCode {
    EXISITNG_USER,
    NEW_USER,
    WRONG_CREDENTIALS
}

export function authenticatePlayer(username: string, password: string): Promise<[UserCredential, FBResponseCode]> {
    return firebase.auth().signInWithEmailAndPassword(username + "@runejs.github.com", password).then((value) => {
        return [value, FBResponseCode.EXISITNG_USER];
    }, (reason) => {
        if (reason.code == 'auth/user-not-found') {
            return [null, FBResponseCode.NEW_USER];
        }
        logger.info(reason);
        return [null, FBResponseCode.WRONG_CREDENTIALS];
    })
}

export function createAccount(username: string, password: string) {
    return admin.auth().createUser({
        displayName: username,
        email: username + "@runejs.github.com",
        password: password
    }).then((value) => {
        return authenticatePlayer(username, password);
    }, (reason) => {
        logger.info(reason);
        return null;
    })
}

export function loadPlayerSaveFirebase(credentials: UserCredential): Promise<PlayerSave> {
    return admin.firestore().collection("players").doc(credentials.user.uid).get().then((value) => {
        if(!value.exists) {
            return null;
        }
        const save: PlayerSave = value.data() as PlayerSave;
        return save;
    }, reason => {
        logger.error(reason);
        return null;
    })
}

export function loadPlayerSave(username: string): PlayerSave {
    const fileName = username.toLowerCase() + '.json';
    const filePath = join('data/saves', fileName);

    if (!existsSync(filePath)) {
        return null;
    }

    const fileData = readFileSync(filePath, 'utf8');

    if (!fileData) {
        return null;
    }

    try {
        return JSON.parse(fileData) as PlayerSave;
    } catch (error) {
        logger.error(`Malformed player save data for ${username}.`);
        return null;
    }
}


export function setupFirebase() {
    logger.info("starting firebase")
    var serviceAccount = require("../../../../firebaseServiceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://runejs-83bb5.firebaseio.com"
    });
    const firebaseConfig = {
        apiKey: "AIzaSyBqFa4W5ZR1-0TqzjNZbzTYSXbTT8t__QM",
        authDomain: "runejs-83bb5.firebaseapp.com",
        databaseURL: "https://runejs-83bb5.firebaseio.com",
        projectId: "runejs-83bb5",
        storageBucket: "runejs-83bb5.appspot.com",
        messagingSenderId: "174021722523",
        appId: "1:174021722523:web:478b08342e019debb7e13e",
        measurementId: "G-JGZEJPDT7R"
    };
    firebase.initializeApp(firebaseConfig);
}
