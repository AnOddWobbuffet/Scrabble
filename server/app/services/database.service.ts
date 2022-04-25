import { Dictionnary } from '@common/classes/dictionnary';
import { Match } from '@common/classes/match';
import { Name } from '@common/classes/name';
import { Score } from '@common/classes/score';
import { Constants } from '@common/constants';
import * as fs from 'fs';
import { Collection, Db, Document, Filter, MongoClient, OptionalId } from 'mongodb';
import 'reflect-metadata';
import { Service } from 'typedi';

const DEFAULT_DICTIONNARY_OBJECT = JSON.parse(fs.readFileSync(Constants.DB.DEFAULT_DICT_PATH, 'utf-8')) as Dictionnary;
const DEFAULT_DICT_INFO = {
    title: DEFAULT_DICTIONNARY_OBJECT.title,
    description: DEFAULT_DICTIONNARY_OBJECT.description,
    path: Constants.DB.DEFAULT_DICT_PATH,
};

@Service()
export class DatabaseService {
    bestClassicScores: Score[];
    bestLOG2990Scores: Score[];
    aiNoviceNames: Name[];
    aiExpertNames: Name[];
    matchHistory: Match[];
    dictionnaries: Dictionnary[];
    private db: Db;
    private client: MongoClient;

    constructor() {
        this.bestClassicScores = [];
        this.bestLOG2990Scores = [];
        this.aiNoviceNames = [];
        this.aiExpertNames = [];
        this.matchHistory = [];
        this.dictionnaries = [];
    }

    async start(url: string = Constants.DB.DATABASE_URL): Promise<MongoClient | null> {
        try {
            this.client = new MongoClient(url);
            await this.client.connect();
            this.db = this.client.db(Constants.DB.DATABASE_NAME);
        } catch {
            throw new Error('Database connection error');
        }
        await this.getAllData();
        return this.client;
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }

    async updateScores(user: string, pts: number, gameMode: string): Promise<void> {
        // username exist in db
        if ((await this.db.collection(gameMode).count({ username: { $in: [user] } })) === 1) {
            // username has higher pts than previous
            if ((await this.db.collection(gameMode).count({ username: { $in: [user] }, points: { $lt: pts } })) === 1) {
                await this.db.collection(gameMode).updateOne({ username: { $in: [user] } }, { $pull: { username: { $eq: user } } });
                this.addToDatabase(user, pts, gameMode);
            }
        } else {
            this.addToDatabase(user, pts, gameMode);
        }
        // remove documents with no username
        this.db.collection(gameMode).deleteMany({ username: [] });
    }

    async addToDatabase(user: string, pts: number, gameMode: string): Promise<void> {
        if ((await this.db.collection(gameMode).count({ points: pts })) === 1) {
            await this.db.collection(gameMode).updateOne({ points: pts }, { $push: { username: user } });
        } else {
            await this.db.collection(gameMode).insertOne({ username: [user], points: pts });
        }
        await this.getAllData();
    }

    async updateBothScores(userHost: string, pointsHost: number, userGuest: string, pointsGuest: number, gameMode: string) {
        if (pointsHost !== pointsGuest) {
            await this.updateScores(userHost, pointsHost, gameMode);
            await this.updateScores(userGuest, pointsGuest, gameMode);
        } else {
            this.removeDuplicates(userHost, userGuest, pointsHost, gameMode);
        }
        await this.getAllData();
    }

    async removeDuplicates(userHost: string, userGuest: string, pts: number, gameMode: string) {
        if ((await this.db.collection(gameMode).count({ points: pts })) === 1) {
            await this.updateScores(userHost, pts, gameMode);
            await this.updateScores(userGuest, pts, gameMode);
        } else {
            await this.db.collection(gameMode).insertOne({ username: [userHost, userGuest], points: pts });
        }
    }

    async insertData(dbName: string, data: OptionalId<Document>) {
        this.db.collection(dbName).insertOne(data);
        this.getAllData();
    }

    async updateData(dbName: string, filter: Filter<Document>, data: OptionalId<Document>) {
        this.db.collection(dbName).replaceOne(filter, data);
        this.getAllData();
    }

    async removeData(dbName: string, data: OptionalId<Document>) {
        this.db.collection(dbName).deleteOne(data);
        this.getAllData();
    }

    addDict(dict: Dictionnary) {
        const filePath = './assets/dicts/' + dict.title + '.json';
        const dictInfo = { title: dict.title, description: dict.description, path: filePath };
        this.dictionnaries.push(dictInfo);
        fs.writeFileSync(filePath, JSON.stringify(dict));
        fs.writeFileSync(Constants.DB.DICT_INFO_PATH, JSON.stringify(this.dictionnaries));
    }

    updateDict(oldTitle: string, newTitle: string, newDesc: string) {
        const newPath = './assets/dicts/' + newTitle + '.json';
        const newInfoDict = { title: newTitle, description: newDesc, path: newPath };
        const indexDict = this.dictionnaries.findIndex((dict: Dictionnary) => dict.title === oldTitle);
        const oldPath = this.dictionnaries[indexDict].path as string;
        const dictUpdate = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
        dictUpdate.title = newTitle;
        dictUpdate.description = newDesc;
        this.dictionnaries[indexDict] = newInfoDict;
        fs.writeFileSync(oldPath, JSON.stringify(dictUpdate));
        fs.renameSync(oldPath, newPath);
        fs.writeFileSync(Constants.DB.DICT_INFO_PATH, JSON.stringify(this.dictionnaries));
    }

    deleteDict(dictTitle: string) {
        const indexDict = this.dictionnaries.findIndex((dict: Dictionnary) => dict.title === dictTitle);
        const path = this.dictionnaries[indexDict].path;
        this.dictionnaries.splice(indexDict, 1);
        fs.writeFileSync(Constants.DB.DICT_INFO_PATH, JSON.stringify(this.dictionnaries));
        fs.unlinkSync(path as string);
    }

    async getAndSortScoresMode(gameMode: string): Promise<Score[]> {
        let dataArray: Score[] = [];
        if (gameMode === Constants.DB.DATABASE_CLASSIC_SCORES) {
            dataArray = await this.getAllClassicScores();
        } else if (gameMode === Constants.DB.DATABASE_LOG2990_SCORES) {
            dataArray = await this.getAllLOG2990Scores();
        }
        dataArray.sort((a, b) => (a.points > b.points ? Constants.LAST_INDEX : 1));
        if (dataArray.length > Constants.DB.SCORE_MAX_LENGTH) {
            while (dataArray.length !== Constants.DB.SCORE_MAX_LENGTH) {
                dataArray.pop();
            }
        }
        return dataArray;
    }

    async getAllData() {
        this.bestClassicScores = await this.getAndSortScoresMode(Constants.DB.DATABASE_CLASSIC_SCORES);
        this.bestLOG2990Scores = await this.getAndSortScoresMode(Constants.DB.DATABASE_LOG2990_SCORES);
        this.aiNoviceNames = (await this.getNames()).filter((name: Name) => name.difficulty === 'Novice');
        this.aiExpertNames = (await this.getNames()).filter((name: Name) => name.difficulty === 'Expert');
        this.matchHistory = await this.getAllPreviousMatches();
        this.dictionnaries = JSON.parse(fs.readFileSync(Constants.DB.DICT_INFO_PATH, 'utf-8'));
    }

    async insertDefault(dbName: string, data: OptionalId<Document>[]) {
        if ((await this.db.collection(dbName).find({}).toArray()).length === 0 && data) {
            this.db.collection(dbName).insertMany(data);
        }
    }

    async resetDict() {
        fs.writeFileSync(Constants.DB.DICT_INFO_PATH, JSON.stringify([DEFAULT_DICT_INFO]));
        for (let i = 1; i < this.dictionnaries.length; i++) {
            fs.unlinkSync(this.dictionnaries[i].path as string);
        }
        await this.getAllData();
    }

    async resetDatabase(dbName: string) {
        await this.db.collection(dbName).deleteMany({});
        switch (dbName) {
            case Constants.DB.DATABASE_CLASSIC_SCORES:
                await this.insertDefault(dbName, Constants.DB.DEFAULT_SCORES);
                break;
            case Constants.DB.DATABASE_LOG2990_SCORES:
                await this.insertDefault(dbName, Constants.DB.DEFAULT_SCORES);
                break;
            case Constants.DB.DATABASE_AI_NAMES:
                await this.insertDefault(dbName, Constants.DB.DEFAULT_NAMES);
                break;
        }
        await this.getAllData();
    }

    async resetPart(part: string) {
        switch (part) {
            case 'MH':
                this.resetDatabase(Constants.DB.DATABASE_MATCH_HISTORY);
                break;
            case 'Dict':
                this.resetDict();
                break;
            case 'Scores':
                this.resetDatabase(Constants.DB.DATABASE_CLASSIC_SCORES);
                this.resetDatabase(Constants.DB.DATABASE_LOG2990_SCORES);
                break;
            case 'AiNames':
                this.resetDatabase(Constants.DB.DATABASE_AI_NAMES);
                break;
        }
    }

    get database(): Db {
        return this.db;
    }

    get collectionClassic(): Collection<Score> {
        return this.db.collection(Constants.DB.DATABASE_CLASSIC_SCORES);
    }

    get collectionLOG2990(): Collection<Score> {
        return this.db.collection(Constants.DB.DATABASE_LOG2990_SCORES);
    }

    get collectionNames(): Collection<Name> {
        return this.db.collection(Constants.DB.DATABASE_AI_NAMES);
    }

    get collectionMH(): Collection<Match> {
        return this.db.collection(Constants.DB.DATABASE_MATCH_HISTORY);
    }

    async getAllClassicScores(): Promise<Score[]> {
        return this.collectionClassic
            .find({})
            .toArray()
            .then((scores: Score[]) => {
                return scores;
            });
    }

    async getAllLOG2990Scores(): Promise<Score[]> {
        return this.collectionLOG2990
            .find({})
            .toArray()
            .then((scores: Score[]) => {
                return scores;
            });
    }

    async getNames(): Promise<Name[]> {
        return this.collectionNames
            .find({})
            .toArray()
            .then((names: Name[]) => {
                return names;
            });
    }

    async getAllPreviousMatches(): Promise<Match[]> {
        return this.collectionMH
            .find({})
            .toArray()
            .then((matches: Match[]) => {
                return matches;
            });
    }
}
