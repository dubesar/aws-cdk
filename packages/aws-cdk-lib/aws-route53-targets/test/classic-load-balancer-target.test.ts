import { Template } from '../../assertions';
import * as ec2 from '../../aws-ec2';
import * as elb from '../../aws-elasticloadbalancing';
import * as route53 from '../../aws-route53';
import { Stack } from '../../core';
import * as targets from '../lib';

test('use classic ELB as record target', () => {
  // GIVEN
  const stack = new Stack();
  const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
  });
  const lb = new elb.LoadBalancer(stack, 'LB', {
    vpc,
    internetFacing: true,
  });

  const zone = new route53.PublicHostedZone(stack, 'HostedZone', { zoneName: 'test.public' });

  // WHEN
  new route53.ARecord(zone, 'Alias', {
    zone,
    recordName: '_foo',
    target: route53.RecordTarget.fromAlias(new targets.ClassicLoadBalancerTarget(lb)),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
    AliasTarget: {
      DNSName: { 'Fn::Join': ['', ['dualstack.', { 'Fn::GetAtt': ['LB8A12904C', 'DNSName'] }]] },
      HostedZoneId: { 'Fn::GetAtt': ['LB8A12904C', 'CanonicalHostedZoneNameID'] },
    },
  });
});

test('use classic ELB as record target with health check', () => {
  // GIVEN
  const stack = new Stack();
  const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
  });
  const lb = new elb.LoadBalancer(stack, 'LB', {
    vpc,
    internetFacing: true,
  });

  const zone = new route53.PublicHostedZone(stack, 'HostedZone', { zoneName: 'test.public' });

  // WHEN
  new route53.ARecord(zone, 'Alias', {
    zone,
    recordName: '_foo',
    target: route53.RecordTarget.fromAlias(
      new targets.ClassicLoadBalancerTarget(lb, {
        evaluateTargetHealth: true,
      }),
    ),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
    AliasTarget: {
      EvaluateTargetHealth: true,
    },
  });
});
