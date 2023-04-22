const SlashCommand = require("../../lib/SlashCommand");
const {
  Client,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ComponentType
} = require("discord.js");
const LoadCommands = require("../../util/loadCommands");
const { filter } = require("lodash");

const command = new SlashCommand()
  .setName("help")
  .setDescription("Shows this list")
  .setRun(async (client, interaction) => {
    await interaction.deferReply().catch((_) => {});
    // map the commands name and description to the embed
    const commands = await LoadCommands().then((cmds) => {
      return [].concat(cmds.slash) /*.concat(cmds.context)*/;
    });
    // from commands remove the ones that have "null" in the description
    const filteredCommands = commands.filter(
      (cmd) => cmd.description != "null"
    );
    //console.log(filteredCommands);
    const totalCmds = filteredCommands.length;
    let maxPages = Math.ceil(totalCmds / client.config.helpCmdPerPage);

    // if git exists, then get commit hash
    let gitHash = "";
    try {
      gitHash = require("child_process")
        .execSync("git rev-parse --short HEAD")
        .toString()
        .trim();
    } catch (e) {
      // do nothing
      gitHash = "unknown";
    }

    // default Page No.
    let pageNo = 0;

    let helpEmbed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setAuthor({
        name: `Commands of ${client.user.username}`,
        iconURL: client.config.iconURL,
      })
      .setTimestamp()
      .setFooter({ text: `Page ${pageNo + 1} / ${maxPages}` });

    // initial temporary array
    var tempArray = filteredCommands.slice(
      pageNo * client.config.helpCmdPerPage,
      pageNo * client.config.helpCmdPerPage + client.config.helpCmdPerPage
    );

    tempArray.forEach((cmd) => {
      helpEmbed.addFields([{ name: cmd.name, value: cmd.description }]);
    });
    helpEmbed.addFields([{
      name: "Credits",
      value:
        `Discord Music Bot Version: v${
          require("../../package.json").version
        }; Build: ${gitHash}` +
        "\n" +
        `[Issues](${client.config.Issues}) | [Source](https://github.com/SudhanPlayz/Discord-MusicBot/tree/v5)`,
    }]);

    // Construction of the buttons for the embed
    const getButtons = (pageNo) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_cmd_but_2_app")
          .setEmoji("◀️")
          .setStyle("Primary")
          .setDisabled(pageNo == 0),
        new ButtonBuilder()
          .setCustomId("help_cmd_but_1_app")
          .setEmoji("▶️")
          .setStyle("Primary")
          .setDisabled(pageNo == maxPages - 1)
      );
    };

    const tempMsg = await interaction.editReply({
      embeds: [helpEmbed],
      components: [getButtons(pageNo)],
      fetchReply: true,
    });
    const collector = tempMsg.createMessageComponentCollector({
      time: 600000,
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (iter) => {
      // console.log(iter);
      if (iter.customId === "help_cmd_but_1_app") {
        pageNo++;
      } else if (iter.customId === "help_cmd_but_2_app") {
        pageNo--;
      }

      helpEmbed.spliceFields(0, client.config.helpCmdPerPage + 1);
      console.log(helpEmbed.data);

      var tempArray = filteredCommands.slice(
        pageNo * client.config.helpCmdPerPage,
        pageNo * client.config.helpCmdPerPage + client.config.helpCmdPerPage
      );

      tempArray.forEach((cmd) => {
        // console.log(cmd);
        helpEmbed
          .addFields([{ name: cmd.name, value: cmd.description }])
          .setFooter({ text: `Page ${pageNo + 1} / ${maxPages}` });
      });
      helpEmbed.addFields([{
        name: "Credits",
        value:
          `Discord Music Bot Version: v${
            require("../../package.json").version
          }; Build: ${gitHash}` +
          "\n" +
          `[Issues](${client.config.Issues}) | [Source](https://github.com/Knight0fNever/Discord-MusicBot/tree/v5)`,
      }]);
      await iter.update({
        embeds: [helpEmbed],
        components: [getButtons(pageNo)],
        fetchReply: true,
      });
    });
  });

module.exports = command;
