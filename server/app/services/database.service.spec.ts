/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable dot-notation */
import { fail } from 'assert';
import { expect } from 'chai';
import * as fs from 'fs';
import { describe } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as sinon from 'sinon';
import { DatabaseService } from './database.service';

describe('Database service', () => {
    let databaseService: DatabaseService;
    const users = ['firstUser', 'secondUser', 'thirdUser', 'fourthUser', 'fifthUser', 'sixthUser'];
    const points = [1, 2, 3, 4, 5, 6];

    beforeEach(async () => {
        databaseService = new DatabaseService();
        // Start a local test server
    });

    afterEach(async () => {
        if (databaseService['client'] !== undefined) {
            await databaseService.closeConnection();
        }
    });

    it('should connect to the database when start is called', async () => {
        // Reconnect to local server
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        expect(databaseService['client']).to.be.not.undefined;
        expect(databaseService['db'].databaseName).to.equal('Scrabble');
    });

    it('should retain its database documents when closing and reconnecting the database', async () => {
        const spyInsert = sinon.spy(databaseService, 'insertDefault');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.database.collection('classique').insertOne({ username: [users[0]], points: points[0] });
        let classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(spyInsert.called);
        expect(classicScores.length).to.equal(1);
        await databaseService.closeConnection();
        await databaseService.start(uri);
        classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
    });

    it('should not connect to the database when start is called with wrong URL', async () => {
        // Try to reconnect to local server
        try {
            await databaseService.start('WRONG URL');
            fail();
        } catch {
            expect(databaseService['client']).to.be.undefined;
        }
    });

    it('should add a document when calling addToDatabase', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.addToDatabase(users[0], points[0], 'classique');
        const classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
    });

    it('should add multiple documents when calling addToDatabase', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.addToDatabase(users[0], points[0], 'classique');
        let classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
        await databaseService.addToDatabase(users[1], points[1], 'classique');
        classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(2);
    });

    it('should add a user in username key when calling addToDatabase if number of points is already present in database', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.addToDatabase(users[0], points[0], 'classique');
        let classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
        await databaseService.addToDatabase(users[1], points[0], 'classique');
        classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
    });

    it('should call addToDatabase when calling updateScores', async () => {
        const spyAdd = sinon.spy(databaseService, 'addToDatabase');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.updateScores(users[0], points[0], 'classique');
        sinon.assert.calledOnce(spyAdd);
    });

    it('should not call addToDatabase when calling updateScores if user has equal or less points', async () => {
        const spyAdd = sinon.spy(databaseService, 'addToDatabase');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.database.collection('classique').insertOne({ username: [users[0]], points: points[1] });
        await databaseService.updateScores(users[0], points[1], 'classique');
        let classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        sinon.assert.notCalled(spyAdd);
        expect(classicScores.length).to.equal(1);
        await databaseService.updateScores(users[0], points[0], 'classique');
        classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        sinon.assert.notCalled(spyAdd);
        expect(classicScores.length).to.equal(1);
    });

    it('should call addToDatabase when calling updateScores if user gained a higher score', async () => {
        const spyAdd = sinon.spy(databaseService, 'addToDatabase');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.database.collection('classique').insertOne({ username: [users[0]], points: points[0] });
        await databaseService.updateScores(users[0], points[1], 'classique');
        sinon.assert.calledOnce(spyAdd);
    });

    it('should not call updateScores twice when calling removeDuplicates if points is not present in database', async () => {
        const spyUpdate = sinon.spy(databaseService, 'updateScores');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.removeDuplicates(users[0], users[1], points[0], 'classique');
        sinon.assert.notCalled(spyUpdate);
    });

    it('should call updateScores twice when calling removeDuplicates if points is present in database', async () => {
        const spyUpdate = sinon.spy(databaseService, 'updateScores');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.database.collection('classique').insertOne({ username: [users[0]], points: points[0] });
        await databaseService.removeDuplicates(users[0], users[1], points[0], 'classique');
        const classicScores = await databaseService['db'].collection('classique').find({}).toArray();
        expect(classicScores.length).to.equal(1);
        sinon.assert.calledTwice(spyUpdate);
    });

    it('should call updateScores twice when calling updateBothScores if both users has different amount of points', async () => {
        const spyUpdate = sinon.spy(databaseService, 'updateScores');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.updateBothScores(users[0], points[0], users[1], points[1], 'classique');
        sinon.assert.calledTwice(spyUpdate);
    });

    it('should call removeDuplicates when calling updateBothScores if both users has the same amount of points', async () => {
        const spyDuplicates = sinon.spy(databaseService, 'removeDuplicates');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        await databaseService.updateBothScores(users[0], points[0], users[1], points[0], 'classique');
        sinon.assert.calledOnce(spyDuplicates);
    });

    it('should insert a data when calling insertData, update a data when calling updateData and delete a data when calling removeData', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        let names = await databaseService['db'].collection('Names').find({}).toArray();
        expect(names.length).to.equal(0);
        await databaseService.insertData('Names', { name: 'Ai1', difficulty: 'Novice' });
        names = await databaseService['db'].collection('Names').find({}).toArray();
        expect(names[0].name).to.equal('Ai1');
        await databaseService.updateData('Names', { name: 'Ai1' }, { name: 'Ai2', difficulty: 'Novice' });
        names = await databaseService['db'].collection('Names').find({}).toArray();
        expect(names[0].name).to.equal('Ai2');
        await databaseService.removeData('Names', { name: 'Ai2', difficulty: 'Novice' });
        names = await databaseService['db'].collection('Names').find({}).toArray();
        expect(names.length).to.equal(0);
    });

    // eslint-disable-next-line max-len
    it('should sort the arrays in descending order based on the amount of points and limit each array size to 5 when calling getAndSortScoresMode', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        for (let i = 0; i < 6; i++) {
            await databaseService.database.collection('classique').insertOne({ username: [users[i]], points: points[i] });
        }
        const scores = await databaseService.getAndSortScoresMode('classique');
        expect(scores.length).to.equals(5);
        for (let i = 0; i < 4; i++) {
            expect(scores[i].points).to.greaterThan(scores[i + 1].points);
        }
    });

    it('should reset the database and insert the default values when calling resetDatabase', async () => {
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await databaseService.start(uri);
        for (let i = 0; i < 6; i++) {
            await databaseService.database.collection('classique').insertOne({ username: [users[i]], points: points[i] });
        }
        let db = await databaseService['db'].collection('classique').find({}).toArray();
        expect(db.length).to.equal(6);
        await databaseService.resetDatabase('classique');
        db = await databaseService['db'].collection('classique').find({}).toArray();
        expect(db.length).to.equal(5);
        await databaseService.resetDatabase('LOG2990');
        db = await databaseService['db'].collection('LOG2990').find({}).toArray();
        expect(db.length).to.equal(5);
        await databaseService.resetDatabase('Names');
        db = await databaseService['db'].collection('Names').find({}).toArray();
        expect(db.length).to.equal(6);
    });

    it('should call writeFileSync when calling resetDict', async () => {
        const writeFileStub = sinon.stub(fs, 'writeFileSync');
        const writeUnlinkStub = sinon.stub(fs, 'unlinkSync');
        const mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        const dict = { title: 'My dict', description: 'Scrabble is very fun', path: './assets/dicts/My dict.json' };
        await databaseService.start(uri);
        databaseService.dictionnaries.push(dict);
        await databaseService.resetDict();
        sinon.assert.called(writeFileStub);
        sinon.assert.called(writeUnlinkStub);
    });
});
