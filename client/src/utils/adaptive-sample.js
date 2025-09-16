export default {
  "type": "AdaptiveCard",
  "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
      {
          "id": "ac-line-chart",
          "title": "New Chart.Line",
          "xAxisTitle": "Month",
          "yAxisTitle": "Amount",
          "colorSet": "categorical",
          "type": "Chart.Line",
          "data": [
              {
                  "legend": "Issues Opened",
                  "values": [
                      {
                          "x": "Jan",
                          "y": 22
                      },
                      {
                          "x": "Feb",
                          "y": 27
                      },
                      {
                          "x": "Mar",
                          "y": 16
                      },
                      {
                          "x": "Apr",
                          "y": 25
                      },
                      {
                          "x": "May",
                          "y": 30
                      },
                      {
                          "x": "Jun",
                          "y": 20
                      }
                  ]
              },
              {
                  "legend": "Days Open",
                  "values": [
                      {
                          "x": "Jan",
                          "y": 45
                      },
                      {
                          "x": "Feb",
                          "y": 10
                      },
                      {
                          "x": "Mar",
                          "y": 9
                      },
                      {
                          "x": "Apr",
                          "y": 5
                      },
                      {
                          "x": "May",
                          "y": 5
                      },
                      {
                          "x": "Jun",
                          "y": 3
                      }
                  ]
              }
          ]
      },
      {
          "type": "TextBlock",
          "text": "AI Affect on Open Issues",
          "wrap": true,
          "size": "Large"
      },
      {
          "type": "TextBlock",
          "text": "For the first half of the year, although the number of issues remained fairly constant (with an average of 19 new issues per month), our rate of closing issues increased dramatically, starting from a high of 45 days between when an issue is open and when it was closed, to now being open only an average of 5 days. This has reduced our issue backlog and improved our customer experience scores as issues are being resolved much more quickly and accurately. We expect to see issue open rates decrease by 25-55% in the next 3 months.",
          "wrap": true
      }
  ],
  "actions": [
      {
          "type": "Action.OpenUrl",
          "title": "View all open issues",
          "url": "https://github.com"
      }
  ],
  "speak": "Adaptive card showing the affect of AI reducing how long issues remain open"
}