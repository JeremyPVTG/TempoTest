# Store Submission Guide

## Pre-Submission Checklist

### 📱 iOS App Store

#### Required Assets
- [ ] **App Icon** (1024x1024px) - High-res version for App Store listing
- [ ] **Screenshots** (Multiple device sizes required):
  - [ ] iPhone 6.9" (1320x2868px) - iPhone 16 Pro Max
  - [ ] iPhone 6.7" (1290x2796px) - iPhone 15 Pro Max, 14 Pro Max
  - [ ] iPhone 6.5" (1242x2688px) - iPhone XS Max, 11 Pro Max
  - [ ] iPhone 5.5" (1242x2208px) - iPhone 8 Plus, 7 Plus
  - [ ] iPad Pro (6th gen) (2048x2732px)
  - [ ] iPad Pro (5th gen) (2048x2732px)
- [ ] **App Preview Videos** (Optional but recommended):
  - [ ] iPhone portrait (30 seconds max)
  - [ ] iPad landscape (30 seconds max)

#### App Information
- [ ] **App Name**: "Habituals" (reserved)
- [ ] **Subtitle**: "Build Better Habits Daily" (max 30 characters)
- [ ] **Description**: Compelling app description (max 4000 characters)
- [ ] **Keywords**: Habit, productivity, goals, tracking, routine (max 100 characters)
- [ ] **Support URL**: https://habituals.app/support
- [ ] **Marketing URL**: https://habituals.app
- [ ] **Privacy Policy URL**: https://habituals.app/privacy

#### Build Information
- [ ] **Version Number**: Use semantic versioning (e.g., 1.0.0)
- [ ] **Build Number**: Increment for each submission
- [ ] **Release Notes**: What's new in this version
- [ ] **Age Rating**: Completed questionnaire
- [ ] **App Category**: Productivity (Primary), Health & Fitness (Secondary)

#### Store Policies Compliance
- [ ] **In-App Purchases**: Configured via App Store Connect
- [ ] **Privacy Labels**: Completed data collection disclosure
- [ ] **Content Rights**: All assets owned or licensed
- [ ] **Functionality**: App fully functional without crashes
- [ ] **Design Guidelines**: Follows Human Interface Guidelines

### 🤖 Google Play Store

#### Required Assets
- [ ] **Feature Graphic** (1024x500px) - Used in Play Store listing
- [ ] **App Icon** (512x512px) - High-res version for Play Store
- [ ] **Screenshots** (Minimum 2, maximum 8):
  - [ ] Phone screenshots (16:9, 9:16 aspect ratio)
  - [ ] 7" Tablet screenshots (16:10, 10:16 aspect ratio)
  - [ ] 10" Tablet screenshots (16:10, 10:16 aspect ratio)

#### App Information
- [ ] **App Title**: "Habituals" (max 50 characters)
- [ ] **Short Description**: Brief app summary (max 80 characters)
- [ ] **Full Description**: Detailed app description (max 4000 characters)
- [ ] **Developer Name**: Habituals Team
- [ ] **Developer Email**: support@habituals.app
- [ ] **Website**: https://habituals.app
- [ ] **Privacy Policy**: https://habituals.app/privacy

#### APK/AAB Information
- [ ] **Target API Level**: Latest stable Android API
- [ ] **Version Code**: Integer that increments with each release
- [ ] **Version Name**: User-facing version string (e.g., "1.0.0")
- [ ] **App Bundle**: Signed release AAB file
- [ ] **Release Notes**: What's new section

#### Store Policies Compliance
- [ ] **Content Rating**: ESRB/PEGI ratings applied
- [ ] **Target Audience**: Appropriate age selection
- [ ] **Permissions**: Only request necessary permissions
- [ ] **In-App Products**: Configured in Play Console
- [ ] **Data Safety**: Completed data collection disclosure

## Submission Process

### Pre-Launch Testing

#### Functional Testing
- [ ] **Core Features**: All habit tracking functionality works
- [ ] **In-App Purchases**: Purchase flows complete successfully
- [ ] **User Onboarding**: New user flow is smooth and intuitive
- [ ] **Data Sync**: User data syncs correctly across devices
- [ ] **Offline Mode**: App gracefully handles offline scenarios
- [ ] **Performance**: App loads quickly and responds smoothly

#### Device Testing
- [ ] **iOS**: Test on iPhone and iPad (multiple iOS versions)
- [ ] **Android**: Test on phones and tablets (multiple Android versions)
- [ ] **Edge Cases**: Low storage, poor network, background/foreground transitions

#### Compliance Testing
- [ ] **Privacy**: Verify privacy policy matches data collection
- [ ] **Accessibility**: VoiceOver/TalkBack support
- [ ] **Localization**: Text displays correctly in supported languages
- [ ] **Age Rating**: Content matches declared age rating

### Release Preparation

#### iOS Release Steps
1. **Archive Build in Xcode**
   - Select "Any iOS Device" in Xcode
   - Product → Archive
   - Validate archive for distribution

2. **Upload to App Store Connect**
   - Use Xcode Organizer or Transporter app
   - Wait for processing (can take 30+ minutes)

3. **Configure Release in App Store Connect**
   - Add app metadata and assets
   - Set pricing and availability
   - Configure In-App Purchases
   - Complete privacy questions

4. **Submit for Review**
   - Review submission details
   - Add reviewer notes if needed
   - Submit for Apple review (1-7 days)

#### Android Release Steps
1. **Generate Signed Bundle**
   - Use Android Studio "Generate Signed Bundle"
   - Select release keystore
   - Choose "Android App Bundle" format

2. **Upload to Play Console**
   - Create new release in Play Console
   - Upload AAB file
   - Add release notes

3. **Configure Store Listing**
   - Upload all required assets
   - Complete store listing details
   - Set content rating and target audience

4. **Rollout Strategy**
   - Start with internal testing
   - Move to closed testing (alpha/beta)
   - Release to production (staged rollout recommended)

### Post-Submission Monitoring

#### Launch Day Checklist
- [ ] **App Store Visibility**: Verify app appears in search results
- [ ] **Download/Install Flow**: Test user acquisition funnel
- [ ] **Critical User Paths**: Monitor key user journeys
- [ ] **Performance Metrics**: Track app performance and crashes
- [ ] **Revenue Metrics**: Monitor in-app purchase conversions
- [ ] **User Feedback**: Respond to reviews and support requests

#### Week 1 Post-Launch
- [ ] **User Acquisition**: Track organic and paid user acquisition
- [ ] **Retention Metrics**: Monitor D1, D3, D7 retention rates
- [ ] **Technical Issues**: Monitor crash reports and performance
- [ ] **Feature Usage**: Analyze which features users engage with most
- [ ] **Revenue Performance**: Track subscription and purchase metrics

## Emergency Procedures

### App Store Issues
- **Rejected Submission**: Review Apple's feedback, make necessary changes, resubmit
- **Post-Launch Bugs**: Use expedited review process for critical fixes
- **Policy Violations**: Work with Apple Developer Support to resolve issues

### Play Store Issues
- **App Suspended**: Contact Google Play Developer Support immediately
- **Policy Violations**: Review Play Console messages and take corrective action
- **Performance Issues**: Monitor Play Console vitals dashboard

### Critical Bug Response
1. **Assess Impact**: Determine if bug affects core functionality or user data
2. **Hotfix Decision**: Decide if issue warrants emergency hotfix release
3. **Communication**: Notify users via in-app messaging if needed
4. **Release Process**: Use expedited review for critical fixes
5. **Post-Fix Monitoring**: Verify fix resolves issue without introducing new problems

## Version Management

### Semantic Versioning
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **Major**: Breaking changes or significant new features
- **Minor**: New features that are backward compatible
- **Patch**: Bug fixes and small improvements

### Release Branches
- **main**: Production-ready code
- **release/vX.Y.Z**: Release preparation branch
- **hotfix/vX.Y.Z**: Emergency fixes

### Build Numbers
- **iOS**: Increment CFBundleVersion for each build
- **Android**: Increment versionCode for each release

## Compliance & Legal

### Privacy Requirements
- **Privacy Policy**: Must be accessible from app and stores
- **Data Collection**: Disclose all data collection in store listings
- **GDPR/CCPA**: Implement required user data controls
- **Children's Privacy**: COPPA compliance if app targets children

### Accessibility Requirements
- **iOS**: VoiceOver support, Dynamic Type, color contrast
- **Android**: TalkBack support, content descriptions, focus handling
- **Testing**: Test with accessibility features enabled

### International Considerations
- **Localization**: Support for multiple languages and regions
- **Currency**: Handle multiple currencies for in-app purchases
- **Legal**: Comply with local laws in target markets
- **Cultural**: Ensure content is appropriate for target regions

## Tools & Resources

### Development Tools
- **Xcode**: iOS development and distribution
- **Android Studio**: Android development and distribution
- **Fastlane**: Automate build and release processes
- **App Store Connect API**: Automate store operations

### Testing Tools
- **TestFlight**: iOS beta distribution
- **Google Play Console**: Android testing tracks
- **Firebase Test Lab**: Automated device testing
- **Crashlytics**: Crash reporting and analytics

### Analytics & Monitoring
- **App Store Connect Analytics**: iOS app performance
- **Google Play Console Analytics**: Android app performance
- **Firebase Analytics**: User behavior and conversion
- **RevenueCat**: Subscription and purchase analytics

### Support Resources
- **Apple Developer Documentation**: iOS guidelines and best practices
- **Google Play Academy**: Android publishing guidance
- **App Store Review Guidelines**: iOS submission requirements
- **Google Play Policy Center**: Android policy requirements