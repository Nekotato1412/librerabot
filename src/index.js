const { Client, Events, GatewayIntentBits, Partials, Collection } = require("discord.js")
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const client = new Client({
     intents: [GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages], 
     partials: [Partials.Message, Partials.Channel, Partials.Reaction]
})

client.commands = new Collection()
client.characterVotes = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file)
	const command = require(filePath)
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command)
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
	}
}

client.once(Events.ClientReady, () => {
    console.log(`${client.user.username} has logged in.`)
})

client.on(Events.InteractionCreate, async (interaction) => {
    // Commands
    if (!interaction.isChatInputCommand()) return
    const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return
	}

	try {
		await command.execute(interaction)
	} catch (error) {
		console.error(error) 
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

// Channel: #new-characters
const submissionChannel = "970444131828649984"
const neededVotes = 3

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    if (reaction.emoji.name == '✅') {
        if (!reaction.message.author.bot && !reaction.me && reaction.message.channelId == submissionChannel && reaction.message.author.id != user.id) {
           let canProceed = true
           reaction.message.reactions.cache.forEach((r, k) => {
                if (r.emoji.name == "☑️" && r.me) {
                    canProceed = false
                }
            }) 
            if (!canProceed) return

            if (client.characterVotes.has(reaction.message.id)) {
                const votes = await client.characterVotes.get(reaction.message.id)
                const newVotes = votes + 1
                await client.characterVotes.set(reaction.message.id, newVotes)

                if (newVotes >= neededVotes) {
                    reaction.message.react('☑️')
                    client.characterVotes.delete(reaction.message.id)
                }
            } else {
                await client.characterVotes.set(reaction.message.id, 1)
            }
        }
    }
})

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    if (reaction.emoji.name == '✅') {
        if (!reaction.message.author.bot && !reaction.me && reaction.message.channelId == submissionChannel && !reaction.message.author.id != user.id) {
            let canProceed = true

           reaction.message.reactions.cache.forEach((r, k) => {
                if (r.emoji.name == "☑️" && r.me) {
                    canProceed = false
                }
            }) 
            if (!canProceed) return

            if (client.characterVotes.has(reaction.message.id)) {
                const votes = await client.characterVotes.get(reaction.message.id)
                const newVotes = votes - 1
               await client.characterVotes.set(reaction.message.id, newVotes)
            }
        }
    }
})

client.login(process.env.TOKEN)