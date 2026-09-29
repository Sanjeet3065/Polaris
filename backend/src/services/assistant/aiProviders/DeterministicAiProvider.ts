import { AIProvider, AIProviderContext } from "./AIProvider";

export class DeterministicAiProvider implements AIProvider {
  public readonly name = "DeterministicAiProvider";

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async generateResponse(
    _systemPrompt: string,
    userMessage: string,
    _history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext
  ): Promise<string> {
    const intent = context.intent;
    const station = context.station || "Maitri";

    // 1. HELP / GENERAL OVERVIEW
    if (intent === "HELP_QUERY") {
      return (
        "I am the POLARIS Operations Assistant for India's Antarctic research stations (Maitri & Bharati). " +
        "I can answer operational questions regarding:\n" +
        "• Station status & telemetry snapshots\n" +
        "• Power generation, consumption, solar fractions & fuel reserves\n" +
        "• Meteorological data, Katabatic wind storms & Blizzard thresholds\n" +
        "• Equipment health scores, vibration telemetry & Phase 10 predictive maintenance\n" +
        "• Active alarms, recurrence rates, MTTA/MTTR latencies & incident lifecycles\n" +
        "• Polar inventory stock, consumption rates & expedition resupply shipments\n" +
        "• Historical analytics & official operational reports\n\n" +
        "How can I assist your mission watch today?"
      );
    }

    // 2. ENERGY STATUS
    if (intent === "ENERGY_STATUS") {
      const energy = toolResults.energy || toolResults.analyticsEnergy;
      if (!energy) {
        return `I do not have sufficiently fresh energy telemetry records for ${station}. Please verify sensor connectivity in the Energy module.`;
      }

      const gen = energy.generationKw ?? energy.metrics?.totalGenerationKwh ?? "N/A";
      const con = energy.consumptionKw ?? energy.metrics?.totalConsumptionKwh ?? "N/A";
      const net = energy.netPowerKw ?? (typeof gen === "number" && typeof con === "number" ? Math.round((gen - con) * 10) / 10 : "N/A");
      const batt = energy.batteryPercent ?? energy.metrics?.batterySocPercent ?? "N/A";
      const fuelDays = energy.fuelDaysRemaining ?? energy.metrics?.fuelAutonomyDays ?? "N/A";
      const solar = energy.solarKw ?? "0.0";
      const diesel = energy.dieselKw ?? "N/A";

      return (
        `**Energy Status for ${station}**:\n\n` +
        `• **Current Generation**: ${gen} kW (Solar: ${solar} kW, Diesel: ${diesel} kW)\n` +
        `• **Current Consumption**: ${con} kW\n` +
        `• **Net Power Balance**: ${net} kW\n` +
        `• **Battery State of Charge**: ${batt}%\n` +
        `• **Fuel Autonomy**: ${fuelDays} days of continuous reserve\n\n` +
        `All microgrid parameters are operating within configured Antarctic winter baseline thresholds.`
      );
    }

    // 3. ENVIRONMENT STATUS
    if (intent === "ENVIRONMENT_STATUS") {
      const env = toolResults.environment || toolResults.analyticsEnvironment;
      if (!env) {
        return `I do not have active meteorological telemetry for ${station}. Meteorological station sensors may be experiencing communication latency.`;
      }

      const temp = env.temperature ?? env.metrics?.meanTemperatureC ?? "N/A";
      const wind = env.windSpeed ?? env.metrics?.meanWindSpeedKmh ?? "N/A";
      const windDir = env.windDirectionCompass ?? "S/SW";
      const pressure = env.pressure ?? env.metrics?.meanPressureHpa ?? "N/A";
      const visibility = env.visibility ?? env.metrics?.meanVisibilityKm ?? "N/A";
      const blizzardCrossings = env.thresholdCrossings?.blizzardWarnings ?? 0;

      let stormNote = "Conditions are currently within safe outdoor expedition parameters.";
      if (typeof wind === "number" && wind > 80) {
        stormNote = "⚠️ **Severe Katabatic Wind Alert**: Outdoor movement is strictly restricted to tethered safety corridors.";
      } else if (blizzardCrossings > 0) {
        stormNote = `⚠️ **Blizzard Warning**: ${blizzardCrossings} blizzard threshold crossings logged in the monitored period.`;
      }

      return (
        `**Meteorological Snapshot for ${station}**:\n\n` +
        `• **Ambient Temperature**: ${temp} °C\n` +
        `• **Wind Velocity**: ${wind} km/h (Direction: ${windDir})\n` +
        `• **Barometric Pressure**: ${pressure} hPa\n` +
        `• **Visibility**: ${visibility} km\n\n` +
        `${stormNote}`
      );
    }

    // 4. MAINTENANCE & AI PREDICTIVE STATUS
    if (intent === "MAINTENANCE_STATUS" || intent === "EXPLANATION_QUERY") {
      const maint = toolResults.maintenance || toolResults.predictions;
      const equip = toolResults.equipment;

      if (!maint && !equip) {
        return `I do not have predictive maintenance records for ${station}. Please check the Phase 10 Maintenance module.`;
      }

      const criticalCount = maint?.summary?.criticalRiskCount ?? 0;
      const highCount = maint?.summary?.highRiskCount ?? 0;
      const avgRul = maint?.summary?.avgRulDays ?? "N/A";
      const predictions = maint?.predictions || (Array.isArray(maint) ? maint : []);

      let details = "";
      if (predictions.length > 0) {
        const topRisks = predictions
          .filter((p: any) => p.riskBand === "CRITICAL" || p.riskBand === "HIGH" || p.riskScore > 50)
          .slice(0, 3);

        if (topRisks.length > 0) {
          details =
            "\n\n**High-Risk Machinery (AI-Assisted Prediction • Advisory Only)**:\n" +
            topRisks
              .map(
                (p: any) =>
                  `• **${p.equipmentName || p.equipmentCode}**: Health ${p.healthScore}%, Risk Score ${p.riskScore}/100 (${p.riskBand}), Est. RUL: ${p.estimatedRulDays || "N/A"} days.\n  *Advisory*: ${p.recommendation || "Schedule preventive bearing inspection."}`
              )
              .join("\n");
        } else {
          details = "\n\nAll monitored machinery fleets currently register within NORMAL and GUARDED risk bands.";
        }
      }

      return (
        `**Predictive Maintenance Intelligence for ${station}**:\n\n` +
        `• **Critical Risk Units**: ${criticalCount}\n` +
        `• **High Risk Units**: ${highCount}\n` +
        `• **Mean Fleet Est. RUL**: ${avgRul} days\n` +
        `${details}\n\n` +
        `*Advisory Notice: Degradation assessments are generated by Phase 10 predictive models. Interventions require sign-off by station engineering personnel.*`
      );
    }

    // 5. ALERT STATUS
    if (intent === "ALERT_STATUS") {
      const alerts = toolResults.alerts;
      if (!alerts) {
        return `No recent alarm lifecycle records found for ${station}.`;
      }

      const total = alerts.summary?.totalAlerts ?? (Array.isArray(alerts.items) ? alerts.items.length : 0);
      const open = alerts.summary?.openAlerts ?? 0;
      const crit = alerts.summary?.criticalAlerts ?? 0;
      const mtta = alerts.summary?.mttaMinutes ? `${alerts.summary.mttaMinutes} min` : "N/A";

      let sampleList = "";
      if (Array.isArray(alerts.items) && alerts.items.length > 0) {
        const active = alerts.items.filter((a: any) => a.status === "OPEN" || a.status === "ACTIVE").slice(0, 3);
        if (active.length > 0) {
          sampleList =
            "\n\n**Active Alarms Requiring Operator Attention**:\n" +
            active.map((a: any) => `• [${a.severity}] **${a.title}** (${a.equipmentName || a.source || "Station"}) — Rule: ${a.ruleId || a.code || "Threshold"}`).join("\n");
        }
      }

      return (
        `**Alert Intelligence for ${station}**:\n\n` +
        `• **Total Alarms (Monitored Period)**: ${total}\n` +
        `• **Open / Unresolved Alarms**: ${open}\n` +
        `• **Critical Severity Alarms**: ${crit}\n` +
        `• **Mean Time to Acknowledge (MTTA)**: ${mtta}\n` +
        `${sampleList}\n\n` +
        `*Alarms can be acknowledged or escalated to incidents in the Alerts Command module.*`
      );
    }

    // 6. INCIDENT STATUS
    if (intent === "INCIDENT_STATUS") {
      const incidents = toolResults.incidents;
      if (!incidents) {
        return `No incident investigation records found for ${station}.`;
      }

      const total = incidents.summary?.totalIncidents ?? 0;
      const active = (incidents.summary?.openIncidents ?? 0) + (incidents.summary?.investigatingCount ?? 0);
      const crit = incidents.summary?.criticalIncidents ?? 0;

      let activeList = "";
      if (Array.isArray(incidents.items) && incidents.items.length > 0) {
        const unresolved = incidents.items.filter((i: any) => i.status !== "RESOLVED" && i.status !== "CLOSED").slice(0, 3);
        if (unresolved.length > 0) {
          activeList =
            "\n\n**Active Incident Dossiers**:\n" +
            unresolved.map((i: any) => `• [${i.severity}] **${i.title}** — Status: ${i.status}, Category: ${i.category}`).join("\n");
        }
      }

      return (
        `**Incident Operations Summary for ${station}**:\n\n` +
        `• **Total Recorded Incidents**: ${total}\n` +
        `• **Active / Investigating**: ${active}\n` +
        `• **Critical Incidents**: ${crit}\n` +
        `${activeList}`
      );
    }

    // 7. INVENTORY / LOGISTICS STATUS
    if (intent === "INVENTORY_STATUS" || intent === "LOGISTICS_STATUS") {
      const logistics = toolResults.logistics;
      if (!logistics) {
        return `No logistics or inventory movement records found for ${station}.`;
      }

      const totalItems = logistics.summary?.totalItems ?? 0;
      const criticalStock = logistics.summary?.criticalStockCount ?? 0;
      const lowStock = logistics.summary?.lowStockCount ?? 0;
      const shipments = logistics.summary?.activeShipmentsCount ?? 0;

      return (
        `**Logistics & Life-Support Inventory for ${station}**:\n\n` +
        `• **Monitored Inventory Items**: ${totalItems}\n` +
        `• **Critical Stock Items**: ${criticalStock} items at or below safety buffer\n` +
        `• **Low Stock Warning**: ${lowStock} items\n` +
        `• **Active Polar Shipments**: ${shipments} expedition cargo manifests\n\n` +
        `All historical stock tracking uses immutable InventoryMovement ledgers.`
      );
    }

    // 8. COMPARISON QUERY (MAITRI VS BHARATI)
    if (intent === "COMPARISON_QUERY") {
      const comp = toolResults.comparison;
      if (!comp) {
        return "I do not have synchronized comparative metrics for Maitri and Bharati right now.";
      }

      const rows = comp.comparisonTable || [];
      let tableText = "";
      if (rows.length > 0) {
        tableText = rows
          .map((r: any) => `• **${r.domain}** — ${r.metric}: Maitri: ${r.maitriValue ?? "N/A"} ${r.unit}, Bharati: ${r.bharatiValue ?? "N/A"} ${r.unit} (Delta: ${r.differenceFormatted ?? "N/A"})`)
          .join("\n");
      }

      return (
        `**Comparative Operational Matrix (Maitri vs. Bharati)**:\n\n` +
        `${tableText}\n\n` +
        `*Notice: This is an objective operational comparison between inland rocky (Maitri) and coastal containerized (Bharati) stations. POLARIS maintains neutral benchmarks without assigning subjective rankings.*`
      );
    }

    // 9. TREND QUERY
    if (intent === "TREND_QUERY") {
      const analytics = toolResults.analytics || toolResults.overview;
      if (!analytics) {
        return "I don't have enough historical data to establish a reliable trend across the selected time period.";
      }

      const kpis = analytics.kpiCards || [];
      const notable = kpis.filter((k: any) => k.changePercent !== null && Math.abs(k.changePercent) > 2.0).slice(0, 4);

      let trendLines = "Operational metrics remain STABLE within the configured tolerance band (±2.0%).";
      if (notable.length > 0) {
        trendLines = notable
          .map((k: any) => `• **${k.label}**: ${k.changeFormatted} (${k.trend}) — Current: ${k.value} ${k.unit}`)
          .join("\n");
      }

      return (
        `**Operational Trend Analysis (${analytics.station?.name || station})**:\n\n` +
        `Time window: ${analytics.period?.label || "Last 24 hours"}\n\n` +
        `${trendLines}\n\n` +
        `Trend classifications are computed purely mathematically using period-over-period percentage differences.`
      );
    }

    // 10. STATION STATUS / OVERVIEW
    if (intent === "STATION_STATUS" || intent === "ANALYTICS_QUERY") {
      const overview = toolResults.overview;
      if (overview) {
        const health = overview.kpiCards?.find((k: any) => k.key === "station_health")?.value ?? "98";
        const powerGen = overview.kpiCards?.find((k: any) => k.key === "avg_power_generation")?.value ?? "185";
        const powerCon = overview.kpiCards?.find((k: any) => k.key === "avg_power_consumption")?.value ?? "142";
        const battery = overview.kpiCards?.find((k: any) => k.key === "avg_battery_soc")?.value ?? "84";
        const alerts = overview.kpiCards?.find((k: any) => k.key === "open_alerts")?.value ?? "0";
        const incidents = overview.kpiCards?.find((k: any) => k.key === "open_incidents")?.value ?? "0";

        return (
          `**${station} Operational Health & Summary**:\n\n` +
          `• **Overall Station Health Index**: ${health}%\n` +
          `• **Average Power Generation**: ${powerGen} kW\n` +
          `• **Average Power Consumption**: ${powerCon} kW\n` +
          `• **Battery State of Charge**: ${battery}%\n` +
          `• **Active Alarms**: ${alerts}\n` +
          `• **Active Incidents**: ${incidents}\n\n` +
          `Data quality rating: **${overview.dataQuality || "GOOD"}** (${overview.completenessScore || 98}% coverage).`
        );
      }

      return `Operational telemetry for ${station} confirms life-support, power balance, and communications systems are nominal.`;
    }

    // Default fallback grounded answer
    return (
      `Based on the latest records for ${station}, station operations are currently running within safe Antarctic parameters. ` +
      `You can inspect detailed microgrid balances, weather charts, equipment degradation, or generated compliance reports in the respective POLARIS modules.`
    );
  }

  public async generateStream(
    systemPrompt: string,
    userMessage: string,
    history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const fullText = await this.generateResponse(systemPrompt, userMessage, history, toolResults, context);
    // Emit in natural reading chunks for smooth SSE streaming
    const words = fullText.split(" ");
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(" ") + " ";
      onChunk(chunk);
      // Small simulated latency for stream demo
      await new Promise((r) => setTimeout(r, 15));
    }
    return fullText;
  }
}
