import { npcAction } from '@server/world/actor/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { Quest } from '@server/world/config/quests';
import { dialogue, DialogueTree, Emote, execute, goto } from '@server/world/actor/dialogue';
import { Player } from '@server/world/actor/player/player';
import { Skill } from '@server/world/actor/skills';
import { itemIds } from '@server/world/config/item-ids';
import { QuestProgress } from '@server/world/actor/player/player-data';

const quest: Quest = {
    id: 'sheepShearer',
    questTabId: 38,
    name: `Sheep Shearer`,
    points: 1,
    stages: {
        NOT_STARTED: `I can start this quest by speaking to <col=800000>Farmer Fred</col> at his ` +
            `<col=800000>farm</col> just a little way <col=800000>North West of Lumbridge</col>.`,
        COLLECTING: (player: Player) => {
            let questLog = `<col=000000><str=800000>I asked Farmer Fred, near Lumbridge, for a quest. Fred \n` +
            `<col=000000><str=800000>said he'd pay me for shearing his sheep for him! \n`;
            const quest = player.getQuest('sheepShearer');

            if (player.hasItemInInventory(itemIds.bucketOfMilk) || quest.attributes.givenMilk) {
                questLog += `I have found a <col=800000>bucket of milk</col> to give to the cook.\n`;
            } else {
                questLog += `I need to find a <col=800000>bucket of milk.</col> There's a cattle field east ` +
                    `of Lumbridge, I should make sure I take an empty bucket with me.\n`;
            }

            if (player.hasItemInInventory(itemIds.potOfFlour) || quest.attributes.givenFlour) {
                questLog += `I have found a <col=800000>pot of flour</col> to give to the cook.\n`;
            } else {
                questLog += `I need to find a <col=800000>pot of flour.</col> There's a mill found north-` +
                    `west of Lumbridge, I should take an empty pot with me.\n`;
            }

            if (player.hasItemInInventory(itemIds.egg) || quest.attributes.givenEgg) {
                questLog += `I have found an <col=800000>egg</col> to give to the cook.\n`;
            } else {
                questLog += `I need to find an <col=800000>egg.</col> The cook normally gets his eggs from ` +
                    `the Groats' farm, found just to the west of the cattle field.`;
            }

            return questLog;
        },
        COMPLETE: {
            color: 0, text: `It was the Duke of Lumbridge's birthday, but his cook had ` +
                `forgotten to buy the ingredients he needed to make him a ` +
                `cake. I brought the cook an egg, some flour and some milk ` +
                `and the cook made a delicious looking cake with them.\n\n` +
                `As a reward he now lets me use his high quality range ` +
                `which lets me burn things less whenever I wish to cook ` +
                `there.\n\n` +
                `<col=ff0000>QUEST COMPLETE!</col>`
        }
    },
    completion: {
        rewards: ['300 Cooking XP'],
        onComplete: (player: Player): void => {
            player.skills.addExp(Skill.COOKING, 300);
        },
        itemId: 1891,
        modelZoom: 240,
        modelRotationX: 180,
        modelRotationY: 180
    }
};

function startQuest(player: Player): Function {
    player.setQuestStage('sheepShearer', 'COLLECTING');
    return (options, tag_INGREDIENT_QUESTIONS) => [
        player => [Emote.HAPPY, `Yes, okay. I can do that.`],
        fred => [Emote.GENERIC, `Good! Now one more thing, do you actually know hot to shear a sheep?`],
        player => [Emote.GENERIC, `Err. No I don't know actually.`],
        fred => [Emote.GENERIC, `Well, first things first, you need a pair of shears. I've got some here you can use.`],

        // TODO: Give player a pair of shears "Fred gives you a set of sharp shears." itemid: 1735 amount: 400

        fred => [Emote.GENERIC, `You just need to go and use them on the sheep out in my field.`],
        player => [Emote.HAPPY, `Sounds easy!`],
        fred => [Emote.LAUGH, `That's what they all say!`],
        fred => [Emote.GENERIC, `Some of the sheep don't like it too much... Persistence is the key.`],
        fred => [Emote.GENERIC, `Once you've collected some wool you can spin it into balls.`],
        fred => [Emote.GENERIC, `Do you know how to spin wool?`],
        player => [Emote.GENERIC, `I don't know how to spin wool, sorry.`],
        fred => [Emote.GENERIC, `Don't worry, it's quite simple!`],
        fred => [Emote.GENERIC, `The nearest Spinning Wheel can be found on the first floor of Lumbridge Castle.`],
        fred => [Emote.GENERIC, `To get to Lumbridge Castle just follow the road east.`],

        // TODO: Show item dialogue "This icon denotes a Spinning Wheel on the world map." itemid: 7670 amount: 400
        player => [Emote.HAPPY, `Thank you!`],

        // `Where do I find some flour?`, [
        //     player => [Emote.GENERIC, `Where do I find some flour?`],
        //     cook => [Emote.GENERIC, `There is a Mill fairly close, go North and then West. Mill Lane Mill ` +
        //     `is just off the road to Draynor. I usually get my flour from there.`],
        //     cook => [Emote.HAPPY, `Talk to Millie, she'll help, she's a lovely girl and a fine Miller.`],
        //     goto('tag_INGREDIENT_QUESTIONS')
        // ],
        // `How about milk?`, [
        //     player => [Emote.GENERIC, `How about milk?`],
        //     cook => [Emote.GENERIC, `There is a cattle field on the other side of the river, just across ` +
        //     `the road from Groats' Farm.`],
        //     cook => [Emote.HAPPY, `Talk to Gillie Groats, she look after the Dairy Cows - ` +
        //     `she'll tell you everything you need to know about milking cows!`],
        //     goto('tag_INGREDIENT_QUESTIONS')
        // ],
        // `And eggs? Where are they found?`, [
        //     player => [Emote.GENERIC, `And eggs? Where are they found?`],
        //     cook => [Emote.GENERIC, `I normally get my eggs from the Groats' farm, on the other side of ` +
        //     `the river.`],
        //     cook => [Emote.GENERIC, `But any chicken should lay eggs.`],
        //     goto('tag_INGREDIENT_QUESTIONS')
        // ],
        // `Actually, I know where to find this stuff.`, [
        //     player => [Emote.GENERIC, `I've got all the information I need. Thanks.`]
        // ]
    ];
}

const startQuestAction: npcAction = (details) => {
    const {player, npc} = details;

    dialogue([player, {npc, key: 'fred'}], [
        fred => [Emote.ANGRY, `What are you doing on my land? You're not the one who keeps leaving all my gates open and letting out all my sheep are you?`],
        options => [
            `I'm looking for a quest.`, [
                player => [Emote.GENERIC, `I'm looking for a quest.`],
                fred => [Emote.GENERIC, `You're after a quest, you say? Actually I could do with a bit of help.`],
                fred => [Emote.GENERIC, `My sheep are getting mighty woolly. I'd be much obliged if you could shear them. And while you're at it spin the wool for me too.`],
                fred => [Emote.GENERIC, `Yes, that's it. Bring me 20 balls of wool. And I'm sure I could sort out some sort of payment. Of course, there's the small matter of The Thing.`],
                options => [
                    `Yes okay. I can do that.`, [
                        startQuest(player)
                    ],
                    `That doesn't sound a very exciting quest.`, [
                        player => [Emote.GENERIC, `That doesn't sound a very exciting quest.`],
                        fred => [Emote.GENERIC, `Well what do you expect if you ask a farmer for a quest? Now are you going to help me or not?`],
                        options => [
                            `Yes okay. I can do that.`, [
                                startQuest(player)
                            ],
                            `No I'll give it a miss.`, [
                                player => [Emote.GENERIC, `No I'll give it a miss.`],
                            ]
                        ]
                    ],
                    `What do you mean, The Thing?`, [
                        player => [Emote.POMPOUS, `What do you mean, The Thing?`],
                        fred => [Emote.SKEPTICAL, `Well now, no one has ever seen The Thing. That's why we call it The Thing, 'cos we don't know what it is.`],
                        fred => [Emote.WORRIED, `Some say it's a black hearted shapeshifter, hungering for the souls of hard working decent folk like me. Others say it's just a sheep.`],
                        fred => [Emote.ANGRY, `Well I don't have all day to stand around and gossip. Are you going to shear my sheep or what!`],
                        options => [
                            `Yes okay. I can do that.`, [
                                startQuest(player)
                            ],
                            `Erm I'm a bit worried about this Thing.`, [
                                player => [Emote.WONDERING, `Erm I'm a bit worried about this Thing.`],
                                fred => [Emote.GENERIC, `I'm sure it's nothing to worry about. Just because my last shearer was seen bolting out of the field screaming for his life doesn't mean anything.`],
                                player => [Emote.GENERIC, `I'm not convinced.`]
                            ]
                        ]
                    ]
                ]
            ],
            `I'm looking for something to kill.`, [
                player => [Emote.HAPPY, `I'm looking for something to kill.`],
                fred => [Emote.ANGRY, `What, on my land? Leave my livestock alone you scoundrel!`]
            ],
            `I'm lost.`, [
                player => [Emote.HAPPY, `I'm lost.`],
                fred => [Emote.WONDERING, `How can you be lost? Just follow the road east and south. You'll end up in Lumbridge fairly quickly.`]
            ],
        ],

    ]);
};

function youStillNeed(quest: QuestProgress): DialogueTree {
    return [
        text => `You still need to get\n` +
            `${!quest.attributes.givenMilk ? `A bucket of milk. ` : ``}${!quest.attributes.givenFlour ? `A pot of flour. ` : ``}${!quest.attributes.givenEgg ? `An egg.` : ``}`,
        options => [
            `I'll get right on it.`, [
                player => [Emote.GENERIC, `I'll get right on it.`]
            ],
            `Can you remind me how to find these things again?`, [
                player => [Emote.GENERIC, `So where do I find these ingredients then?`],
            ]
        ]
    ];
}

const handInIngredientsAction: npcAction = (details) => {
    const {player, npc} = details;

    const dialogueTree: DialogueTree = [
        cook => [Emote.GENERIC, `How are you getting on with finding the ingredients?`]
    ];

    const quest = player.quests.find(quest => quest.questId === 'cooksAssistant');

    const ingredients = [
        {itemId: itemIds.bucketOfMilk, text: `Here's a bucket of milk.`, attr: 'givenMilk'},
        {itemId: itemIds.potOfFlour, text: `Here's a pot of flour.`, attr: 'givenFlour'},
        {itemId: itemIds.egg, text: `Here's a fresh egg.`, attr: 'givenEgg'}
    ];

    for (const ingredient of ingredients) {
        if (quest.attributes[ingredient.attr]) {
            quest.attributes.ingredientCount++;
            continue;
        }

        if (!player.hasItemInInventory(ingredient.itemId)) {
            continue;
        }

        dialogueTree.push(
            player => [Emote.GENERIC, ingredient.text],
            execute(() => {
                const quest = player.quests.find(quest => quest.questId === 'cooksAssistant');

                if (player.removeFirstItem(ingredient.itemId) !== -1) {
                    quest.attributes[ingredient.attr] = true;
                }
            })
        );
    }

    dialogueTree.push(
        goto(() => {
            const count = [quest.attributes.givenMilk, quest.attributes.givenFlour, quest.attributes.givenEgg]
                .filter(value => value === true).length;

            if (count === 3) {
                return 'tag_ALL_INGREDIENTS';
            } else if (count === 0) {
                return 'tag_NO_INGREDIENTS';
            } else {
                return 'tag_SOME_INGREDIENTS';
            }
        }),
        (subtree, tag_ALL_INGREDIENTS) => [
            cook => [Emote.HAPPY, `You've brought me everything I need! I am saved! Thank you!`],
            player => [Emote.WONDERING, `So do I get to go to the Duke's Party?`],
            cook => [Emote.SAD, `I'm afraid not, only the big cheeses get to dine with the Duke.`],
            player => [Emote.GENERIC, `Well, maybe one day I'll be important enough to sit on the Duke's table.`],
            cook => [Emote.SKEPTICAL, `Maybe, but I won't be holding my breath.`],
            execute(() => {
                    player.setQuestStage('cooksAssistant', 'COMPLETE');
            })
        ],
        (subtree, tag_NO_INGREDIENTS) => [
            player => [Emote.GENERIC, `I haven't got any of them yet, I'm still looking.`],
            cook => [Emote.SAD, `Please get the ingredients quickly. I'm running out of time! ` +
            `The Duke will throw me into the streets!`],
            ...youStillNeed(quest)
        ],
        (subtree, tag_SOME_INGREDIENTS) => [
            cook => [Emote.SAD, `Thanks for the ingredients you have got so far, please get the rest quickly. ` +
            `I'm running out of time! The Duke will throw me into the streets!`],
            ...youStillNeed(quest)
        ]
    );

    dialogue([player, {npc, key: 'cook'}], dialogueTree);
};

export default new RunePlugin([{
    type: ActionType.QUEST,
    quest
}, {
    type: ActionType.NPC_ACTION,
    questAction: {questId: 'sheepShearer', stage: 'NOT_STARTED'},
    npcIds: npcIds.fredTheFarmer,
    options: 'talk-to',
    walkTo: true,
    action: startQuestAction
}, {
    type: ActionType.NPC_ACTION,
    questAction: {questId: 'sheepShearer', stage: 'COLLECTING'},
    npcIds: npcIds.fredTheFarmer,
    options: 'talk-to',
    walkTo: true,
    action: handInIngredientsAction
}]);
