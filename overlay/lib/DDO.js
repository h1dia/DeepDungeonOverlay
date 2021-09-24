'use strict'

;(function()
{

    window.DDO = {};

    DDO.SaveFiles = {
                        "the Palace of the Dead": [],
                        "Heaven-on-High": []
                    };
    DDO.Snapshot = {};
    DDO.Beastiary = {};
    DDO.DataElements = {};

    DDO.ParsedLogNumbers = ['00', '12', '21', '22', '25', '26', '33'];

    DDO.playerName = "NULL";
    DDO.playerJob = 0;
    DDO.playerLevel = 1;

    DDO.affluenceActive = false;
    DDO.alterationActive = false;
    DDO.flightActive = false;
    DDO.sightActive = false;
    DDO.raisingActive = false;

    DDO.currentFloor = 0;
    DDO.speedRunBonus = true;
    DDO.isInGroup = false;
    DDO.soloRunUnderway = false;
    DDO.groupRunUnderway = false;
    DDO.inbetweenArea = false;

    DDO.currentInstance = "NULL";
    DDO.currentFloorStats = {};
    DDO.currentFloorSetStats = {};
    DDO.currentSaveFileIndex = 0;

    DDO.currentTargetName = "NULL";
    DDO.currentTargetID = "NULL";
    DDO.currentTargetHPP = 100;

    DDO.triggeredTraps = [];
    DDO.enchantmentsApplied = [];

    DDO.SetDefaultConfig = async function()
    {
        DDO.Config = {};
        DDO.Config.scoreVisible = true;
        DDO.Config.pomandersVisible = true;
        DDO.Config.statsVisible = true;
        DDO.Config.beastiaryVisible = true;
        await callOverlayHandler({call: "saveData", key: "DDO_Config", data: JSON.stringify(DDO.Config)}); 
    }

    DDO.SaveConfig = async function()
    {
        DDO.Config.scoreVisible = DDO.DataElements.ScoreCheckBoxValue.checked;
        DDO.Config.pomandersVisible = DDO.DataElements.PomandersCheckBoxValue.checked;
        DDO.Config.statsVisible = DDO.DataElements.StatisticsCheckBoxValue.checked;
        DDO.Config.beastiaryVisible = DDO.DataElements.BeastiaryCheckBoxValue.checked;
        await callOverlayHandler({call: "saveData", key: "DDO_Config", data: JSON.stringify(DDO.Config)}); 
    }

    DDO.LoadConfig = function(instanceName)
    {
        if (instanceName.includes(DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].ParseStrings.CurrentInstanceFloorsPOTD) ||
            instanceName.includes(DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].ParseStrings.CurrentInstanceFloorsHOH))
        {
            if(DDO.soloRunUnderway || DDO.groupRunUnderway){
                // At the end of cutscenes a new zone change message is received.  This is so we dont lose our current dungeon
                DDO.currentInstance = instanceName.substring(0, instanceName.indexOf('(')).trim();
            }
            else if (!DDO.isInGroup && !DDO.soloRunUnderway){
                DDO.LoadSoloConfig();
                DDO.currentFloorStats = {};
                DDO.currentFloorSetStats = {};
                DDO.soloRunUnderway = true;
                DDO.currentFloor = parseInt(instanceName.substring(instanceName.lastIndexOf(' ') + 1,instanceName.lastIndexOf('-')));
                DDO.currentInstance = instanceName.substring(0, instanceName.indexOf('(')).trim();
                DDO.LoadSave();                    
            }else if (DDO.isInGroup && !DDO.groupRunUnderway){
                DDO.LoadPartyConfig();
                DDO.groupRunUnderway = true;
                DDO.currentFloor = parseInt(instanceName.substring(instanceName.lastIndexOf(' ') + 1, instanceName.lastIndexOf('-')));
                DDO.currentInstance = instanceName.substring(0, instanceName.indexOf('(')).trim();
            }
            DDO.inbetweenArea = false;
        }
        else if (instanceName == DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].ParseStrings.CurrentInstancePOTD ||
                instanceName == DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].ParseStrings.CurrentInstanceHOH){
            if (!DDO.soloRunUnderway && !DDO.groupRunUnderway){
                // If they just logged in or reset the plugin/act treat this zone like any other zone
                DDO.soloRunUnderway = false;
                DDO.groupRunUnderway = false;
                DDO.inbetweenArea = false;
                DDO.currentInstance = instanceName;
                DDO.LoadNonRunConfig(); 
            }else{
                // Otherwise they just finished a set and we proceed like normal
                DDO.inbetweenArea = true;
                DDO.currentInstance = instanceName;
                DDO.currentFloorStats = {};
                DDO.currentFloorSetStats = {};
            }
        }
        else {
            DDO.soloRunUnderway = false;
            DDO.groupRunUnderway = false;
            DDO.inbetweenArea = false;
            DDO.currentInstance = instanceName;
            DDO.LoadNonRunConfig(); 
        }
    }

    DDO.LoadSoloConfig = function()
    {
        DDO.DataElements.ScoreCheckBoxValue.checked = DDO.Config.scoreVisible;
        DDO.DataElements.PomandersCheckBoxValue.checked = DDO.Config.pomandersVisible;
        DDO.DataElements.StatisticsCheckBoxValue.checked = DDO.Config.statsVisible;
        DDO.DataElements.BeastiaryCheckBoxValue.checked = DDO.Config.beastiaryVisible;

        DDO.EnableDisableElement(DDO.DataElements.ScoreCheckBoxValue.checked, 'score', false);
        DDO.EnableDisableElement(DDO.DataElements.PomandersCheckBoxValue.checked, 'pomanders', false);
        DDO.EnableDisableElement(DDO.DataElements.StatisticsCheckBoxValue.checked, 'statistics', false);
        DDO.EnableDisableElement(DDO.DataElements.BeastiaryCheckBoxValue.checked, 'targetinfo', false);

        DDO.EnableDisableElement(false, 'saveManager', false);
        DDO.EnableDisableElement(true, 'config', false);
    }

    DDO.LoadPartyConfig = function()
    {
        DDO.DataElements.ScoreCheckBoxValue.checked = false;
        DDO.DataElements.PomandersCheckBoxValue.checked = false;
        DDO.DataElements.StatisticsCheckBoxValue.checked = false;
        DDO.DataElements.BeastiaryCheckBoxValue.checked = true;

        DDO.EnableDisableElement(DDO.DataElements.ScoreCheckBoxValue.checked, 'score', false);
        DDO.EnableDisableElement(DDO.DataElements.PomandersCheckBoxValue.checked, 'pomanders', false);
        DDO.EnableDisableElement(DDO.DataElements.StatisticsCheckBoxValue.checked, 'statistics', false);
        DDO.EnableDisableElement(DDO.DataElements.BeastiaryCheckBoxValue.checked, 'targetinfo', false);

        DDO.EnableDisableElement(false, 'saveManager', false);
    }

    DDO.LoadNonRunConfig = function()
    {
        DDO.EnableDisableElement(false, 'config', false);
        DDO.EnableDisableElement(true, 'saveManager', false);
        DDO.EnableDisableElement(false, 'score', false);
        DDO.EnableDisableElement(false, 'pomanders', false);
        DDO.EnableDisableElement(false, 'statistics', false);
        DDO.EnableDisableElement(false, 'targetinfo', false);

        if (DDO.SaveFiles['the Palace of the Dead'].length > 0 )
            DDO.DataElements.POTDButton.innerText = `${DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].UIStrings['POTDButton']} (${DDO.SaveFiles['the Palace of the Dead'].length})`;
        if (DDO.SaveFiles['Heaven-on-High'].length > 0 )
            DDO.DataElements.HOHButton.innerText = `${DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].UIStrings['HOHButton']} (${DDO.SaveFiles['Heaven-on-High'].length})`;
    }

    DDO.LoadSave = function()
    {
        let saveFound = false;
        for (var i = 0; i < DDO.SaveFiles[DDO.currentInstance].length; i++)
        {
            if (DDO.SaveFiles[DDO.currentInstance][i].playerName == DDO.playerName &&
                DDO.SaveFiles[DDO.currentInstance][i].playerJob == DDO.playerJob &&
                DDO.SaveFiles[DDO.currentInstance][i].lastFloorCleared == DDO.currentFloor - 1)
            {
                DDO.currentSaveFileIndex = i;
                DDO.Snapshot = JSON.parse(JSON.stringify(DDO.SaveFiles[DDO.currentInstance][i]));
                saveFound = true;
            }
        }
        if (!saveFound){
            var newSave = {};
            newSave.playerName = DDO.playerName;
            newSave.playerJob = DDO.playerJob;
            newSave.deepDungeonName = DDO.currentInstance;
            newSave.lastFloorCleared = DDO.currentFloor - 1;
            newSave.floorStartedOn = DDO.currentFloor;
            newSave.totalKillCount = 0;
            newSave.floorKillCounts = new Array(20).fill(0);
            newSave.currentSpecialKillCount = 0;
            newSave.currentTrapsTriggered = 0;
            newSave.currentMimicCount = 0;
            newSave.currentKorriganCount = 0;
            newSave.currentSpeedRunBonusCount = 0;
            newSave.currentChestCount = 0;
            newSave.currentMapRevealCount = 0;
            newSave.currentEnchantmentCount = 0;
            newSave.currentRoomRevealCount = 0;
            newSave.currentRezCount = 0;
            newSave.currentKOCount = 0;

            DDO.currentSaveFileIndex = DDO.SaveFiles[DDO.currentInstance].length;
            DDO.SaveFiles[DDO.currentInstance].push(newSave);        
            DDO.Snapshot = JSON.parse(JSON.stringify(newSave));
        }    

        let currentSave = DDO.SaveFiles[DDO.currentInstance][DDO.currentSaveFileIndex];
        DDO.DataElements.MonstersFloorValue.innerText = 0;
        DDO.DataElements.MonstersSetValue.innerText = 0;
        DDO.DataElements.MonstersTotalValue.innerText = currentSave.totalKillCount;
        DDO.DataElements.MimicsFloorValue.innerText = 0;
        DDO.DataElements.MimicsSetValue.innerText = 0;
        DDO.DataElements.MimicsTotalValue.innerText = currentSave.currentMimicCount;
        DDO.DataElements.TrapsFloorValue.innerText = 0;
        DDO.DataElements.TrapsSetValue.innerText = 0;
        DDO.DataElements.TrapsTotalValue.innerText = currentSave.currentTrapsTriggered;
        DDO.DataElements.ChestsFloorValue.innerText = 0;
        DDO.DataElements.ChestsSetValue.innerText = 0;
        DDO.DataElements.ChestsTotalValue.innerText = currentSave.currentChestCount;
        DDO.DataElements.EnchantmentsFloorValue.innerText = 0;
        DDO.DataElements.EnchantmentsSetValue.innerText = 0;
        DDO.DataElements.EnchantmentsTotalValue.innerText = currentSave.currentEnchantmentCount;
        DDO.DataElements.RareMonstersFloorValue.innerText = 0;
        DDO.DataElements.RareMonstersSetValue.innerText = 0;
        DDO.DataElements.RareMonstersTotalValue.innerText = currentSave.currentSpecialKillCount;
        DDO.DataElements.SpeedRunsFloorValue.innerText = 0;
        DDO.DataElements.SpeedRunsSetValue.innerText = 0;
        DDO.DataElements.SpeedRunsTotalValue.innerText = currentSave.currentSpeedRunBonusCount;
    }

    DDO.SaveRuns = function()
    {
        callOverlayHandler({call: "saveData", key: "DDO_Saves", data: JSON.stringify(DDO.SaveFiles)});
    }

    DDO.EnableDisableElement = function(enabled, targetElement, saveConfig)
    {
        var element = document.getElementById(targetElement);
        if (enabled)
            element.style.display = "";
        if (!enabled)
            element.style.display = "none";
        if (saveConfig)
            DDO.SaveConfig();
    }

    DDO.TurnTargetImagesOff = function()
    {
        DDO.DataElements.DangerEasyImage.style.display = "none";
        DDO.DataElements.DangerCautionImage.style.display = "none";
        DDO.DataElements.DangerScaryImage.style.display = "none";
        DDO.DataElements.DangerImpossibleImage.style.display = "none";
        DDO.DataElements.AggroSightImage.style.display = "none";
        DDO.DataElements.AggroSoundImage.style.display = "none";
        DDO.DataElements.AggroProximityImage.style.display = "none";
    }

    DDO.UpdatePlayerInfo = async function()
    {
        var combatants = await window.callOverlayHandler({ call: 'getCombatants', names: [DDO.playerName] });
        if (combatants.combatants.length > 0){
            DDO.playerJob = combatants.combatants[0].Job;
            DDO.playerLevel = combatants.combatants[0].Level;
            if (DDO.soloRunUnderway && !DDO.inbetweenArea)
                DDO.UpdateScore();
        }
    }

    DDO.ClearPOTDSaves = function()
    {
        DDO.SaveFiles['the Palace of the Dead'] = [];
        DDO.DataElements.POTDButton.innerText = DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].UIStrings['POTDButton'];
        DDO.SaveRuns();
    }

    DDO.ClearHOHSaves = function()
    {
        DDO.SaveFiles['Heaven-on-High'] = [];
        DDO.DataElements.HOHButton.innerText = DDO.localeInformation.Languages[DDO.localeInformation.CurrentLanguage].UIStrings['HOHButton'];
        DDO.SaveRuns();
    }

    DDO.UpdateScore = function()
    {
        console.log('Calculating Score');
        let currentSave = DDO.SaveFiles[DDO.currentInstance][DDO.currentSaveFileIndex];
        let score = DDO.ScoreCalculator.CalulcateCurrentScore(currentSave, DDO.playerLevel, 101);

        let roomRevealAddition = currentSave.deepDungeonName == "the Palace of the Dead" ? 
                                 currentSave.currentRoomRevealCount * 631 : 
                                 currentSave.currentRoomRevealCount * 421;
        score += roomRevealAddition;

        DDO.DataElements.ScoreValue.innerText = score.toLocaleString();
    }

    DDO.AssignDataElements = function()
    {
        DDO.DataElements.POTDButton = document.getElementById("POTDButton");
        DDO.DataElements.HOHButton = document.getElementById("HOHButton");

        DDO.DataElements.ScoreValue = document.getElementById("Score");
        DDO.DataElements.MonstersFloorValue = document.getElementById("MonstersFloor");
        DDO.DataElements.MonstersSetValue = document.getElementById("MonstersSet");
        DDO.DataElements.MonstersTotalValue = document.getElementById("MonstersTotal");

        DDO.DataElements.MimicsFloorValue = document.getElementById("MimicsFloor");
        DDO.DataElements.MimicsSetValue = document.getElementById("MimicsSet");
        DDO.DataElements.MimicsTotalValue = document.getElementById("MimicsTotal");

        DDO.DataElements.TrapsFloorValue = document.getElementById("TrapsFloor");
        DDO.DataElements.TrapsSetValue = document.getElementById("TrapsSet");
        DDO.DataElements.TrapsTotalValue = document.getElementById("TrapsTotal");

        DDO.DataElements.ChestsFloorValue = document.getElementById("ChestsFloor");
        DDO.DataElements.ChestsSetValue = document.getElementById("ChestsSet");
        DDO.DataElements.ChestsTotalValue = document.getElementById("ChestsTotal");

        DDO.DataElements.EnchantmentsFloorValue = document.getElementById("EnchantmentsFloor");
        DDO.DataElements.EnchantmentsSetValue = document.getElementById("EnchantmentsSet");
        DDO.DataElements.EnchantmentsTotalValue = document.getElementById("EnchantmentsTotal");

        DDO.DataElements.RareMonstersFloorValue = document.getElementById("RareMonstersFloor");
        DDO.DataElements.RareMonstersSetValue = document.getElementById("RareMonstersSet");
        DDO.DataElements.RareMonstersTotalValue = document.getElementById("RareMonstersTotal");

        DDO.DataElements.SpeedRunsFloorValue = document.getElementById("SpeedRunsFloor");
        DDO.DataElements.SpeedRunsSetValue = document.getElementById("SpeedRunsSet");
        DDO.DataElements.SpeedRunsTotalValue = document.getElementById("SpeedRunsTotal");

        DDO.DataElements.TargetNameValue = document.getElementById("TargetName");
        DDO.DataElements.TargetHPPValue = document.getElementById("TargetHPP");
        DDO.DataElements.DangerEasyImage = document.getElementById("DangerEasy");
        DDO.DataElements.DangerCautionImage = document.getElementById("DangerCaution");
        DDO.DataElements.DangerScaryImage = document.getElementById("DangerScary");
        DDO.DataElements.DangerImpossibleImage = document.getElementById("DangerImpossible");
        DDO.DataElements.AggroSightImage = document.getElementById("AggroSight");
        DDO.DataElements.AggroSoundImage = document.getElementById("AggroSound");
        DDO.DataElements.AggroProximityImage = document.getElementById("AggroProximity");
        DDO.DataElements.TargetInformationValue = document.getElementById("TargetInformation");

        DDO.DataElements.BeastiaryCheckBoxValue = document.getElementById("CheckBoxBestiary");
        DDO.DataElements.StatisticsCheckBoxValue = document.getElementById("CheckBoxStatistics");
        DDO.DataElements.PomandersCheckBoxValue = document.getElementById("CheckBoxPomanders");
        DDO.DataElements.ScoreCheckBoxValue = document.getElementById("CheckBoxScore");

        DDO.DataElements.PomSafetyDisabledImage = document.getElementById("PomSafetyDisabled");
        DDO.DataElements.PomSightDisabledImage = document.getElementById("PomSightDisabled");
        DDO.DataElements.PomAffluenceDisabledImage = document.getElementById("PomAffluenceDisabled");
        DDO.DataElements.PomAlterationDisabledImage = document.getElementById("PomAlterationDisabled");
        DDO.DataElements.PomFlightDisabledImage = document.getElementById("PomFlightDisabled");

        DDO.DataElements.PomSafetyEnabledImage = document.getElementById("PomSafetyEnabled");
        DDO.DataElements.PomSightEnabledImage = document.getElementById("PomSightEnabled");
        DDO.DataElements.PomAffluenceEnabledImage = document.getElementById("PomAffluenceEnabled");
        DDO.DataElements.PomAlterationEnabledImage = document.getElementById("PomAlterationEnabled");
        DDO.DataElements.PomFlightEnabledImage = document.getElementById("PomFlightEnabled");            
    }

    DDO.CalculateScoreNoRoomReveal = async function()
    {
        let file = "DDT_TEST-HoH.DDT";
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => 
        {
            if(xhttp.status == 404)
            {
                console.log("ERROR: Cannot find save file");
                return;
            }
            if(xhttp.status === 404)
            {
                console.log("ERROR: Cannot find save file");
                return;
            }
            if (xhttp.readyState === 4 && xhttp.status === 200) 
            {
                var json;
                try
                {
                    json = JSON.parse(xhttp.responseText);     
                    console.log(json[0]);                       
                }
                catch(e)
                {
                    return;
                }

                let score = DDO.ScoreCalculator.CalulcateCurrentScore(json[0], 68, 101);
                document.getElementById("debugScore").innerText = score.toLocaleString();
            }
        };

        xhttp.open('GET', file, true);
        xhttp.send();    
    }

})()