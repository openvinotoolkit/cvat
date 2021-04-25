---
title: "XML annotation format"
linkTitle: "XML annotation format"
weight: 3
---

When you want to download annotations from Computer Vision Annotation Tool (CVAT) you can choose one of several data formats. The document describes XML annotation format. Each format has X.Y version (e.g. 1.0). In general the major version (X) is incremented when the data format has incompatible changes and the minor version (Y) is incremented when the data format is slightly modified (e.g. it has one or several extra fields inside meta information). The document will describe all changes for all versions of XML annotation format.

## Version 1.1

There are two different formats for annotation and interpolation modes at the moment. Both formats have a common part which is described below. From previous version `flipped` tag was added. Also `original_size` tag was added for interpolation mode to specify frame size. In annotation mode each image tag has `width` and `height` attributes for the same purpose.

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.1</version>
  <meta>
    <task>
      <id>Number: id of the task</id>
      <name>String: some task name</name>
      <size>Number: count of frames/images in the task</size>
      <mode>String: interpolation or annotation</mode>
      <overlap>Number: number of overlaped frames between segments</overlap>
      <bugtracker>String: URL on an page which describe the task</bugtracker>
      <flipped>Boolean: were images of the task flipped? (True/False)</flipped>
      <created>String: date when the task was created</created>
      <updated>String: date when the task was updated</updated>
      <labels>
        <label>
          <name>String: name of the label (e.g. car, person)</name>
          <attributes>
            <attribute>
              <name>String: attribute name</name>
              <mutable>Boolean: mutable (allow different values between frames)</mutable>
              <input_type>String: select, checkbox, radio, number, text</input_type>
              <default_value>String: default value</default_value>
              <values>String: possible values, separated by newlines
ex. value 2
ex. value 3</values>
            </attribute>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>Number: id of the segment</id>
          <start>Number: first frame</start>
          <stop>Number: last frame</stop>
          <url>String: URL (e.g. http://cvat.example.com/?id=213)</url>
        </segment>
      </segments>
      <owner>
        <username>String: the author of the task</username>
        <email>String: email of the author</email>
      </owner>
      <original_size>
        <width>Number: frame width</width>
        <height>Number: frame height</height>
      </original_size>
    </task>
    <dumped>String: date when the annotation was dumped</dumped>
  </meta>
  ...
</annotations>
```

### Annotation

Below you can find description of the data format for annotation mode. In this mode images are annotated. On each image it is possible to have many different objects. Each object can have multiple attributes. If an annotation task has been
created with `z_order` flag then each object will have `z_order` attribute which is used to draw objects properly when they are intersected (if `z_order` is bigger the object is closer to camera). In previous versions of the format only `box` shape was available. In later releases `polygon`, `polyline`, and `points` were added. Please see below for more details:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  ...
  <image id="Number: id of the image (the index in lexical order of images)" name="String: path to the image"
    width="Number: image width" height="Number: image height">
    <box label="String: the associated label" xtl="Number: float" ytl="Number: float" xbr="Number: float" ybr="Number: float" occluded="Number: 0 - False, 1 - True" z_order="Number: z-order of the object">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </box>
    <polygon label="String: the associated label" points="x0,y0;x1,y1;..." occluded="Number: 0 - False, 1 - True"
    z_order="Number: z-order of the object">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </polygon>
    <polyline label="String: the associated label" points="x0,y0;x1,y1;..." occluded="Number: 0 - False, 1 - True"
    z_order="Number: z-order of the object">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </polyline>
    <polyline label="String: the associated label" points="x0,y0;x1,y1;..." occluded="Number: 0 - False, 1 - True"
    z_order="Number: z-order of the object">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </polyline>
    <points label="String: the associated label" points="x0,y0;x1,y1;..." occluded="Number: 0 - False, 1 - True"
    z_order="Number: z-order of the object">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </points>
    ...
  </image>
  ...
</annotations>
```

Example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.1</version>
  <meta>
    <task>
      <id>4</id>
      <name>segmentation</name>
      <size>27</size>
      <mode>annotation</mode>
      <overlap>0</overlap>
      <bugtracker></bugtracker>
      <flipped>False</flipped>
      <created>2018-09-25 11:34:24.617558+03:00</created>
      <updated>2018-09-25 11:38:27.301183+03:00</updated>
      <labels>
        <label>
          <name>car</name>
          <attributes>
          </attributes>
        </label>
        <label>
          <name>traffic_line</name>
          <attributes>
          </attributes>
        </label>
        <label>
          <name>wheel</name>
          <attributes>
          </attributes>
        </label>
        <label>
          <name>plate</name>
          <attributes>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>4</id>
          <start>0</start>
          <stop>26</stop>
          <url>http://localhost:8080/?id=4</url>
        </segment>
      </segments>
      <owner>
        <username>admin</username>
        <email></email>
      </owner>
    </task>
    <dumped>2018-09-25 11:38:28.799808+03:00</dumped>
  </meta>
  <image id="0" name="filename000.jpg" width="1600" height="1200">
    <box label="plate" xtl="797.33" ytl="870.92" xbr="965.52" ybr="928.94" occluded="0" z_order="4">
    </box>
    <polygon label="car" points="561.30,916.23;561.30,842.77;554.72,761.63;553.62,716.67;565.68,677.20;577.74,566.45;547.04,559.87;536.08,542.33;528.40,520.40;541.56,512.72;559.10,509.43;582.13,506.14;588.71,464.48;583.23,448.03;587.61,434.87;594.19,431.58;609.54,399.78;633.66,369.08;676.43,294.52;695.07,279.17;703.84,279.17;735.64,268.20;817.88,264.91;923.14,266.01;997.70,274.78;1047.04,283.55;1063.49,289.04;1090.90,330.70;1111.74,371.27;1135.86,397.59;1147.92,428.29;1155.60,435.97;1157.79,451.32;1156.69,462.28;1159.98,491.89;1163.27,522.59;1173.14,513.82;1199.46,516.01;1224.68,521.49;1225.77,544.52;1207.13,568.64;1181.91,576.32;1178.62,582.90;1177.53,619.08;1186.30,680.48;1199.46,711.19;1206.03,733.12;1203.84,760.53;1197.26,818.64;1199.46,840.57;1203.84,908.56;1192.88,930.49;1184.10,939.26;1162.17,944.74;1139.15,960.09;1058.01,976.54;1028.40,969.96;1002.09,972.15;931.91,974.35;844.19,972.15;772.92,972.15;729.06,967.77;713.71,971.06;685.20,973.25;659.98,968.86;644.63,984.21;623.80,983.12;588.71,985.31;560.20,966.67" occluded="0" z_order="1">
    </polygon>
    <polyline label="traffic_line" points="462.10,0.00;126.80,1200.00" occluded="0" z_order="3">
    </polyline>
    <polyline label="traffic_line" points="1212.40,0.00;1568.66,1200.00" occluded="0" z_order="2">
    </polyline>
    <points label="wheel" points="574.90,939.48;1170.16,907.90;1130.69,445.26;600.16,459.48" occluded="0" z_order="5">
    </points>
  </image>
</annotations>
```

### Interpolation

Below you can find description of the data format for interpolation mode. In the mode frames are annotated. The annotation contains tracks. Each track corresponds to an object which can be presented on multiple frames. The same object cannot be presented on the same frame in multiple locations. Each location of the object can have multiple attributes even if an attribute is immutable for the object it will be cloned for each location (a known redundancy).

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  ...
  <track id="Number: id of the track (doesn't have any special meeting" label="String: the associated label">
    <box frame="Number: frame" xtl="Number: float" ytl="Number: float" xbr="Number: float" ybr="Number: float" outside="Number: 0 - False, 1 - True" occluded="Number: 0 - False, 1 - True" keyframe="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </box>
    <polygon frame="Number: frame" points="x0,y0;x1,y1;..." outside="Number: 0 - False, 1 - True" occluded="Number: 0 - False, 1 - True" keyframe="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
    </polygon>
    <polyline frame="Number: frame" points="x0,y0;x1,y1;..." outside="Number: 0 - False, 1 - True" occluded="Number: 0 - False, 1 - True" keyframe="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
    </polyline>
    <points frame="Number: frame" points="x0,y0;x1,y1;..." outside="Number: 0 - False, 1 - True" occluded="Number: 0 - False, 1 - True" keyframe="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
    </points>
    ...
  </track>
  ...
</annotations>
```

Example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.1</version>
  <meta>
    <task>
      <id>5</id>
      <name>interpolation</name>
      <size>4620</size>
      <mode>interpolation</mode>
      <overlap>5</overlap>
      <bugtracker></bugtracker>
      <flipped>False</flipped>
      <created>2018-09-25 12:32:09.868194+03:00</created>
      <updated>2018-09-25 16:05:05.619841+03:00</updated>
      <labels>
        <label>
          <name>person</name>
          <attributes>
          </attributes>
        </label>
        <label>
          <name>car</name>
          <attributes>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>5</id>
          <start>0</start>
          <stop>4619</stop>
          <url>http://localhost:8080/?id=5</url>
        </segment>
      </segments>
      <owner>
        <username>admin</username>
        <email></email>
      </owner>
      <original_size>
        <width>640</width>
        <height>480</height>
      </original_size>
    </task>
    <dumped>2018-09-25 16:05:07.134046+03:00</dumped>
  </meta>
  <track id="0" label="car">
    <polygon frame="0" points="324.79,213.16;323.74,227.90;347.42,237.37;371.11,217.37;350.05,190.00;318.47,191.58" outside="0" occluded="0" keyframe="1">
    </polygon>
    <polygon frame="1" points="324.79,213.16;323.74,227.90;347.42,237.37;371.11,217.37;350.05,190.00;318.47,191.58" outside="1" occluded="0" keyframe="1">
    </polygon>
    <polygon frame="6" points="305.32,237.90;312.16,207.90;352.69,206.32;355.32,233.16;331.11,254.74" outside="0" occluded="0" keyframe="1">
    </polygon>
    <polygon frame="7" points="305.32,237.90;312.16,207.90;352.69,206.32;355.32,233.16;331.11,254.74" outside="1" occluded="0" keyframe="1">
    </polygon>
    <polygon frame="13" points="313.74,233.16;331.11,220.00;359.53,243.16;333.21,283.16;287.95,274.74" outside="0" occluded="0" keyframe="1">
    </polygon>
    <polygon frame="14" points="313.74,233.16;331.11,220.00;359.53,243.16;333.21,283.16;287.95,274.74" outside="1" occluded="0" keyframe="1">
    </polygon>
  </track>
</annotations>
```

## Version 1

There are two different formats for annotation and interpolation modes at the moment. Both formats has a common part which is described below:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.0</version>
  <meta>
    <task>
      <id>Number: id of the task</id>
      <name>String: some task name</name>
      <size>Number: count of frames/images in the task</size>
      <mode>String: interpolation or annotation</mode>
      <overlap>Number: number of overlaped frames between segments</overlap>
      <bugtracker>String: URL on an page which describe the task</bugtracker>
      <created>String: date when the task was created</created>
      <updated>String: date when the task was updated</updated>
      <labels>
        <label>
          <name>String: name of the label (e.g. car, person)</name>
          <attributes>
            <attribute>String: attributes for the label (e.g. @select=quality:good,bad)</attribute>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>Number: id of the segment</id>
          <start>Number: first frame</start>
          <stop>Number: last frame</stop>
          <url>String: URL (e.g. http://cvat.example.com/?id=213)</url>
        </segment>
      </segments>
      <owner>
        <username>String: the author of the task</username>
        <email>String: email of the author</email>
      </owner>
    </task>
    <dumped>String: date when the annotation was dumped</dumped>
  </meta>
  ...
</annotations>
```

### Annotation

Below you can find description of the data format for annotation mode. In the mode images are annotated. On each image it is possible to have many different objects. Each object can have multiple attributes.

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  ...
  <image id="Number: id of the image (the index in lexical order of images)" name="String: path to the image">
    <box label="String: the associated label" xtl="Number: float" ytl="Number: float" xbr="Number: float" ybr="Number: float" occluded="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </box>
    ...
  </image>
  ...
</annotations>
```

Example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.0</version>
  <meta>
    <task>
      <id>1063</id>
      <name>My annotation task</name>
      <size>75</size>
      <mode>annotation</mode>
      <overlap>0</overlap>
      <bugtracker></bugtracker>
      <created>2018-06-06 11:57:54.807162+03:00</created>
      <updated>2018-06-06 12:42:29.375251+03:00</updated>
      <labels>
        <label>
          <name>car</name>
          <attributes>
            <attribute>@select=model:a,b,c,d</attribute>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>3086</id>
          <start>0</start>
          <stop>74</stop>
          <url>http://cvat.examle.com:8080/?id=3086</url>
        </segment>
      </segments>
      <owner>
        <username>admin</username>
        <email></email>
      </owner>
    </task>
    <dumped>2018-06-06 15:47:04.386866+03:00</dumped>
  </meta>
  <image id="0" name="C15_L1_0001.jpg">
    <box label="car" xtl="38.95" ytl="26.51" xbr="140.64" ybr="54.29" occluded="0">
      <attribute name="parked">false</attribute>
      <attribute name="model">a</attribute>
    </box>
  </image>
  <image id="1" name="C15_L1_0002.jpg">
    <box label="car" xtl="49.13" ytl="23.34" xbr="149.54" ybr="53.88" occluded="0">
      <attribute name="parked">true</attribute>
      <attribute name="model">a</attribute>
    </box>
  </image>
  <image id="2" name="C15_L1_0003.jpg">
    <box label="car" xtl="50.73" ytl="30.26" xbr="146.72" ybr="59.97" occluded="0">
      <attribute name="parked">false</attribute>
      <attribute name="model">b</attribute>
    </box>
  </image>
  <image id="39" name="C15_L1_0040.jpg">
    <box label="car" xtl="49.60" ytl="30.15" xbr="150.19" ybr="58.06" occluded="0">
      <attribute name="parked">false</attribute>
      <attribute name="model">c</attribute>
    </box>
  </image>
</annotations>
```

### Interpolation

Below you can find description of the data format for interpolation mode. In this mode frames are annotated. The annotation contains tracks. Each track corresponds to an object which can be presented on multiple frames. The same object cannot be presented on the same frame in multiple locations. Each location of the object can have multiple attributes even if an attribute is immutable for the object it will be cloned for each location (a known redundancy).

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  ...
  <track id="Number: id of the track (doesn't have any special meeting" label="String: the associated label">
    <box frame="Number: frame" xtl="Number: float" ytl="Number: float" xbr="Number: float" ybr="Number: float" outside="Number: 0 - False, 1 - True" occluded="Number: 0 - False, 1 - True" keyframe="Number: 0 - False, 1 - True">
      <attribute name="String: an attribute name">String: the attribute value</attribute>
      ...
    </box>
    ...
  </track>
  ...
</annotations>
```

Example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<annotations>
  <version>1.0</version>
  <meta>
    <task>
      <id>1062</id>
      <name>My interpolation task</name>
      <size>30084</size>
      <mode>interpolation</mode>
      <overlap>20</overlap>
      <bugtracker></bugtracker>
      <created>2018-05-31 14:13:36.483219+03:00</created>
      <updated>2018-06-06 13:56:32.113705+03:00</updated>
      <labels>
        <label>
          <name>car</name>
          <attributes>
            <attribute>@select=model:1,2,3,4</attribute>
          </attributes>
        </label>
      </labels>
      <segments>
        <segment>
          <id>3085</id>
          <start>0</start>
          <stop>30083</stop>
          <url>http://cvat.example.com:8080/?id=3085</url>
        </segment>
      </segments>
      <owner>
        <username>admin</username>
        <email></email>
      </owner>
    </task>
    <dumped>2018-06-06 15:52:11.138470+03:00</dumped>
  </meta>
  <track id="0" label="car">
    <box frame="110" xtl="634.12" ytl="37.68" xbr="661.50" ybr="71.37" outside="0" occluded="1" keyframe="1">
      <attribute name="model">1</attribute>
    </box>
    <box frame="111" xtl="634.21" ytl="38.50" xbr="661.59" ybr="72.19" outside="0" occluded="1" keyframe="0">
      <attribute name="model">1</attribute>
    </box>
    <box frame="112" xtl="634.30" ytl="39.32" xbr="661.67" ybr="73.01" outside="1" occluded="1" keyframe="1">
      <attribute name="model">1</attribute>
    </box>
  </track>
  <track id="1" label="car">
    <box frame="0" xtl="626.81" ytl="30.96" xbr="656.05" ybr="58.88" outside="0" occluded="0" keyframe="1">
      <attribute name="model">3</attribute>
    </box>
    <box frame="1" xtl="626.63" ytl="31.56" xbr="655.87" ybr="59.48" outside="0" occluded="0" keyframe="0">
      <attribute name="model">3</attribute>
    </box>
    <box frame="2" xtl="626.09" ytl="33.38" xbr="655.33" ybr="61.29" outside="1" occluded="0" keyframe="1">
      <attribute name="model">3</attribute>
    </box>
  </track>
</annotations>
```
