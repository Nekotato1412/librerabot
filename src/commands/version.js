const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('version')
		.setDescription('Developer command to retrieve the application version.'),
	async execute(interaction) {
        const { version } = require('../../package.json')
		await interaction.reply(version);
	},
};