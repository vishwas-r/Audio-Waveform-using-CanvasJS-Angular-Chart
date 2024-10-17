import { Component } from '@angular/core';
 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  chart: any;
	chartOptions = {
    title: {
      text: "Load MP3 File",
      fontFamily: "Trebuchet MS, Helvetica, sans-serif",
      dockInsidePlotArea: true,
      verticalAlign: "center"
    },
		axisX: {
      tickLength: 0,
      lineThickness: 0,
      labelFontSize: 0,
      labelFormatter: function(e: any) {
        return "";
      }
    },
    axisY: {
      tickLength: 0,
      lineThickness: 0,
      gridThickness: 0,
      labelFontSize: 0,
      labelFormatter: function(e: any) {
        return "";
      }
    },
    data: [{
      type: "rangeArea",
      toolTipContent: null,
      highlightEnabled: false,
      color: "#ff6862",
      dataPoints: []
    }]
	}

  getChartInstance = (chart: any) => {		
		this.chart = chart;
	}

  audioContext: any;
  source: any;
  buttonStatus: boolean = false;
  intervalId: any;

  onFileSelected = async (event: any) => {
    let file:File = event.target.files[0];
    if (file) {
      this.chart.title.set("text", "Loading File...");
      let margin = 10,
          chunkSize = 500,
          height = this.chart.get("height"),
          scaleFactor = (height - margin * 2) / 2;

      this.audioContext = new AudioContext();

      let buffer = await file.arrayBuffer(),
          audioBuffer = await this.audioContext.decodeAudioData(buffer),
          float32Array = audioBuffer.getChannelData(0);

      let array = [], i = 0, length = float32Array.length;

      while (i < length) {
        array.push(
          float32Array.slice(i, i += chunkSize).reduce(function (total: any, value: any) {
            return Math.max(total, Math.abs(value));
          })
        );
      }
      let dps = []
      for (let index in array) {
        dps.push({ x: margin + Number(index), y: [height / 2 - array[index] * scaleFactor, height / 2 + array[index] * scaleFactor]});
      }
      this.chart.options.data[0].dataPoints = dps;
      this.chart.options.title.text = file.name;
      this.chart.render();
      this.chart.axisY[0].set("minimum", 0, false);
      this.chart.axisY[0].set("maximum", dps[0].y[0] * 2, false);
      this.chart.axisX[0].addTo("stripLines", {startValue: 0, endValue: 0, showOnTop: true, color: "#fff", opacity: 0.7});

      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.loop = false;
      this.source.connect(this.audioContext.destination);
      
      this.source.start();

      this.source.onended = () => {
        this.chart.axisX[0].stripLines[0].set("endValue", this.chart.axisX[0].get("maximum"));
        clearInterval(this.intervalId);
      }
      this.intervalId = setInterval(() => {
        this.chart.axisX[0].stripLines[0].set("endValue", this.audioContext.currentTime * (this.chart.data[0].dataPoints.length / audioBuffer.duration));
      }, 50); 
    }
  }

  togglePlaying = (event: any) => {
    if(this.audioContext) {
      if(this.audioContext.state === 'running') {
        this.audioContext.suspend().then(() => {
          this.buttonStatus = !this.buttonStatus;
        });
      }
      else if(this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.buttonStatus = !this.buttonStatus;
        });
      }
    }
  }

  stopPlaying = (event: any) => {
      this.source.stop();
  }

  ngOnDestroy = () => {
    if(this.intervalId) {
      clearInterval(this.intervalId);
    }
    if(this.chart)
      this.chart.destroy();
  }
}
